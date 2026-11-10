import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  PRESENTATION_FORMAT_OPTIONS,
  presentationMimesForFormats,
} from '../settings/presentation-settings';
import { mbToBytes } from '../settings/media-settings';

export type LessonPresentationPublic = {
  id: number;
  originalName: string;
  url: string;
  mime: string;
  sizeBytes: number;
};

export type LessonMaterialPublic = {
  title: string;
  description: string | null;
  source: 'content' | 'teacher';
  presentation: LessonPresentationPublic | null;
};

@Injectable()
export class LessonPresentationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  toPublic(row: {
    id: number;
    originalName: string;
    url: string;
    mime: string;
    sizeBytes: number;
  }): LessonPresentationPublic {
    return {
      id: row.id,
      originalName: row.originalName,
      url: row.url,
      mime: row.mime,
      sizeBytes: row.sizeBytes,
    };
  }

  async getForContentLesson(contentLessonId: number) {
    const row = await this.prisma.lessonPresentation.findUnique({
      where: { contentLessonId },
    });
    return row ? this.toPublic(row) : null;
  }

  async uploadForContentLesson(contentLessonId: number, file?: Express.Multer.File) {
    await this.ensureContentLesson(contentLessonId);
    this.validateFile(file);
    const settings = await this.settings.getPresentationSettings();
    this.assertAllowed(file!, settings.formats, settings.maxMb);

    const existing = await this.prisma.lessonPresentation.findUnique({
      where: { contentLessonId },
    });
    const url = await this.writeFile(file!);
    const row = await this.prisma.lessonPresentation.upsert({
      where: { contentLessonId },
      create: {
        contentLessonId,
        originalName: file!.originalname.slice(0, 255),
        url,
        mime: file!.mimetype,
        sizeBytes: file!.size,
      },
      update: {
        originalName: file!.originalname.slice(0, 255),
        url,
        mime: file!.mimetype,
        sizeBytes: file!.size,
      },
    });
    if (existing?.url && existing.url !== url) {
      await this.deleteFile(existing.url);
    }
    return this.toPublic(row);
  }

  async removeForContentLesson(contentLessonId: number) {
    await this.ensureContentLesson(contentLessonId);
    const existing = await this.prisma.lessonPresentation.findUnique({
      where: { contentLessonId },
    });
    if (!existing) return { ok: true };
    await this.prisma.lessonPresentation.delete({ where: { contentLessonId } });
    await this.deleteFile(existing.url);
    return { ok: true };
  }

  async copyToTeacherLesson(sourceContentLessonId: number, teacherLessonId: number) {
    const source = await this.prisma.lessonPresentation.findUnique({
      where: { contentLessonId: sourceContentLessonId },
    });
    if (!source) return null;

    const url = await this.duplicateFile(source.url, source.originalName);
    const row = await this.prisma.lessonPresentation.create({
      data: {
        teacherLessonId,
        originalName: source.originalName,
        url,
        mime: source.mime,
        sizeBytes: source.sizeBytes,
      },
    });
    return this.toPublic(row);
  }

  async resolveScheduledMaterial(lesson: {
    contentLessonId: number | null;
    teacherLessonId: number | null;
  }): Promise<LessonMaterialPublic | null> {
    if (lesson.teacherLessonId) {
      const item = await this.prisma.teacherLesson.findUnique({
        where: { id: lesson.teacherLessonId },
        include: { presentation: true },
      });
      if (!item) return null;
      return {
        title: item.title,
        description: item.description,
        source: 'teacher',
        presentation: item.presentation ? this.toPublic(item.presentation) : null,
      };
    }

    if (lesson.contentLessonId) {
      const item = await this.prisma.contentLesson.findUnique({
        where: { id: lesson.contentLessonId },
        include: { presentation: true },
      });
      if (!item) return null;
      return {
        title: item.title,
        description: item.description,
        source: 'content',
        presentation: item.presentation ? this.toPublic(item.presentation) : null,
      };
    }

    return null;
  }

  private async ensureContentLesson(id: number) {
    const item = await this.prisma.contentLesson.findUnique({ where: { id }, select: { id: true } });
    if (!item) throw new NotFoundException('Урок не знайдено');
  }

  private validateFile(file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Оберіть файл презентації');
    }
  }

  private assertAllowed(file: Express.Multer.File, formats: string[], maxMb: number) {
    const allowed = new Set(presentationMimesForFormats(formats));
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException('Формат презентації не дозволено');
    }
    if (file.size > mbToBytes(maxMb)) {
      throw new BadRequestException(`Файл перевищує ${maxMb} МБ`);
    }
  }

  private uploadsRoot() {
    return join(process.cwd(), 'uploads');
  }

  private async writeFile(file: Express.Multer.File) {
    const now = new Date();
    const folder = join(
      'presentations',
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    );
    const ext = this.safeExt(file.originalname, file.mimetype);
    const hash = createHash('sha1').update(randomBytes(8)).digest('hex').slice(0, 12);
    const filename = `${Date.now()}-${hash}${ext}`;
    const relative = join(folder, filename);
    const absolute = join(this.uploadsRoot(), relative);
    await fs.mkdir(dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, file.buffer);
    return `/uploads/${relative.replace(/\\/g, '/')}`;
  }

  private async duplicateFile(sourceUrl: string, originalName: string) {
    if (!sourceUrl.startsWith('/uploads/')) {
      return sourceUrl;
    }
    const absolute = join(this.uploadsRoot(), sourceUrl.replace(/^\/uploads\//, ''));
    const buffer = await fs.readFile(absolute);
    const ext = extname(originalName) || extname(sourceUrl) || '.pdf';
    const hash = createHash('sha1').update(randomBytes(8)).digest('hex').slice(0, 12);
    const now = new Date();
    const folder = join(
      'presentations',
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    );
    const filename = `${Date.now()}-${hash}${ext}`;
    const relative = join(folder, filename);
    const target = join(this.uploadsRoot(), relative);
    await fs.mkdir(dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
    return `/uploads/${relative.replace(/\\/g, '/')}`;
  }

  private async deleteFile(url: string) {
    if (!url.startsWith('/uploads/')) return;
    const absolute = join(this.uploadsRoot(), url.replace(/^\/uploads\//, ''));
    try {
      await fs.unlink(absolute);
    } catch {
      /* missing file */
    }
  }

  private safeExt(originalName: string, mime: string) {
    const fromName = extname(originalName).toLowerCase();
    if (fromName && fromName.length <= 8) return fromName;
    const match = PRESENTATION_FORMAT_OPTIONS.find((item) => item.mimes.includes(mime));
    return match?.extensions[0] ?? '.bin';
  }
}
