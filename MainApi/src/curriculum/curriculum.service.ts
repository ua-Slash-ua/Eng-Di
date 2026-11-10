import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentEntityType, TeacherAccessMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TestsService } from '../tests/tests.service';
import { ContentChainService } from './content-chain.service';
import { CreateContentCourseDto } from './dto/create-content-course.dto';
import { CreateContentLessonDto } from './dto/create-content-lesson.dto';
import { CreateContentLevelDto } from './dto/create-content-level.dto';
import { CreateContentUnitDto } from './dto/create-content-unit.dto';
import { UpdateContentCourseDto } from './dto/update-content-course.dto';
import { UpdateContentLessonDto } from './dto/update-content-lesson.dto';
import { UpdateContentLevelDto } from './dto/update-content-level.dto';
import { UpdateContentUnitDto } from './dto/update-content-unit.dto';

@Injectable()
export class CurriculumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chain: ContentChainService,
    private readonly tests: TestsService,
  ) {}

  // ── Levels ────────────────────────────────────────────────────────────────

  listLevels() {
    return this.prisma.contentLevel.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: { courses: { select: { id: true } } },
    });
  }

  async findLevel(id: number) {
    const item = await this.prisma.contentLevel.findUnique({
      where: { id },
      include: { courses: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
    });
    if (!item) throw new NotFoundException('Рівень не знайдено');
    return item;
  }

  async createLevel(dto: CreateContentLevelDto) {
    const last = await this.prisma.contentLevel.findFirst({ orderBy: { sortOrder: 'desc' } });
    return this.prisma.contentLevel.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        sortOrder: dto.sortOrder ?? (last?.sortOrder ?? 0) + 1,
      },
    });
  }

  async updateLevel(id: number, dto: UpdateContentLevelDto) {
    await this.findLevel(id);
    return this.prisma.contentLevel.update({
      where: { id },
      data: {
        ...(dto.code !== undefined ? { code: dto.code.trim().toUpperCase() } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() ?? null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async removeLevel(id: number) {
    await this.findLevel(id);
    await this.prisma.contentLevel.delete({ where: { id } });
    return { ok: true };
  }

  // ── Courses ───────────────────────────────────────────────────────────────

  async listCourses(levelId?: number) {
    const rows = await this.prisma.contentCourse.findMany({
      where: levelId ? { levelId } : {},
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        level: { select: { id: true, code: true, title: true } },
        units: {
          select: {
            id: true,
            _count: { select: { lessons: true } },
          },
        },
      },
    });
    return rows.map((row) => ({
      ...row,
      unitCount: row.units.length,
      lessonCount: row.units.reduce((sum, unit) => sum + unit._count.lessons, 0),
      isFree: row.levelId == null,
    }));
  }

  async findCourse(id: number) {
    const item = await this.prisma.contentCourse.findUnique({
      where: { id },
      include: {
        level: { select: { id: true, code: true, title: true } },
        units: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          include: { _count: { select: { lessons: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException('Курс не знайдено');
    return {
      ...item,
      unitCount: item.units.length,
      lessonCount: item.units.reduce((sum, unit) => sum + unit._count.lessons, 0),
      isFree: item.levelId == null,
    };
  }

  async createCourse(dto: CreateContentCourseDto) {
    const last = await this.prisma.contentCourse.findFirst({ orderBy: { sortOrder: 'desc' } });
    return this.prisma.contentCourse.create({
      data: {
        levelId: dto.levelId ?? null,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        sortOrder: dto.sortOrder ?? (last?.sortOrder ?? 0) + 1,
      },
    });
  }

  async updateCourse(id: number, dto: UpdateContentCourseDto) {
    await this.findCourse(id);
    await this.prisma.contentCourse.update({
      where: { id },
      data: {
        ...(dto.levelId !== undefined ? { levelId: dto.levelId ?? null } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() ?? null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });

    if (dto.unitIds !== undefined) {
      const unitIds = [...new Set(dto.unitIds)];
      await this.prisma.contentUnit.updateMany({
        where: { courseId: id, id: { notIn: unitIds.length ? unitIds : [-1] } },
        data: { courseId: null },
      });
      for (let i = 0; i < unitIds.length; i += 1) {
        await this.prisma.contentUnit.update({
          where: { id: unitIds[i] },
          data: { courseId: id, sortOrder: i + 1 },
        });
      }
    }

    return this.findCourse(id);
  }

  async removeCourse(id: number) {
    await this.findCourse(id);
    await this.prisma.contentCourse.delete({ where: { id } });
    return { ok: true };
  }

  // ── Units ─────────────────────────────────────────────────────────────────

  async listUnits(courseId?: number) {
    const rows = await this.prisma.contentUnit.findMany({
      where: courseId !== undefined ? { courseId } : {},
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        course: {
          select: {
            id: true,
            title: true,
            level: { select: { id: true, code: true, title: true } },
          },
        },
        _count: { select: { lessons: true } },
      },
    });
    return rows.map((row) => ({
      ...row,
      lessonCount: row._count.lessons,
      isFree: row.courseId == null,
    }));
  }

  async findUnit(id: number) {
    const item = await this.prisma.contentUnit.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            level: { select: { id: true, code: true, title: true } },
          },
        },
        lessons: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        _count: { select: { lessons: true } },
      },
    });
    if (!item) throw new NotFoundException('Юніт не знайдено');
    return {
      ...item,
      lessonCount: item._count.lessons,
      isFree: item.courseId == null,
    };
  }

  async createUnit(dto: CreateContentUnitDto) {
    const last = await this.prisma.contentUnit.findFirst({ orderBy: { sortOrder: 'desc' } });
    return this.prisma.contentUnit.create({
      data: {
        courseId: dto.courseId ?? null,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        sortOrder: dto.sortOrder ?? (last?.sortOrder ?? 0) + 1,
      },
    });
  }

  async updateUnit(id: number, dto: UpdateContentUnitDto) {
    await this.findUnit(id);
    await this.prisma.contentUnit.update({
      where: { id },
      data: {
        ...(dto.courseId !== undefined ? { courseId: dto.courseId ?? null } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() ?? null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });

    if (dto.lessonIds !== undefined) {
      const lessonIds = [...new Set(dto.lessonIds)];
      await this.prisma.contentLesson.updateMany({
        where: { unitId: id, id: { notIn: lessonIds.length ? lessonIds : [-1] } },
        data: { unitId: null },
      });
      for (let i = 0; i < lessonIds.length; i += 1) {
        await this.prisma.contentLesson.update({
          where: { id: lessonIds[i] },
          data: { unitId: id, sortOrder: i + 1 },
        });
      }
    }

    return this.findUnit(id);
  }

  async removeUnit(id: number) {
    await this.findUnit(id);
    await this.prisma.contentUnit.delete({ where: { id } });
    return { ok: true };
  }

  // ── Content Lessons ───────────────────────────────────────────────────────

  async listContentLessons(unitId?: number) {
    const rows = await this.prisma.contentLesson.findMany({
      where: unitId !== undefined ? { unitId } : {},
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        unit: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
                level: { select: { id: true, code: true, title: true } },
              },
            },
          },
        },
      },
    });
    return rows.map((row) => ({
      ...row,
      isFree: row.unitId == null,
    }));
  }

  async findContentLesson(id: number) {
    const item = await this.prisma.contentLesson.findUnique({
      where: { id },
      include: {
        presentation: true,
        unit: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
                level: { select: { id: true, code: true, title: true } },
              },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Урок не знайдено');
    const { presentation, ...rest } = item;
    const chain = await this.chain.buildLessonChain(id);
    const linkedTests = chain ? await this.tests.listMaterialTestsForAdminChain(chain) : [];
    return {
      ...rest,
      isFree: item.unitId == null,
      presentation: presentation
        ? {
            id: presentation.id,
            originalName: presentation.originalName,
            url: presentation.url,
            mime: presentation.mime,
            sizeBytes: presentation.sizeBytes,
          }
        : null,
      linkedTests,
    };
  }

  async createContentLesson(dto: CreateContentLessonDto) {
    const last = await this.prisma.contentLesson.findFirst({ orderBy: { sortOrder: 'desc' } });
    return this.prisma.contentLesson.create({
      data: {
        unitId: dto.unitId ?? null,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        content: (dto.content as object) ?? null,
        sortOrder: dto.sortOrder ?? (last?.sortOrder ?? 0) + 1,
      },
    });
  }

  async updateContentLesson(id: number, dto: UpdateContentLessonDto) {
    await this.findContentLesson(id);
    return this.prisma.contentLesson.update({
      where: { id },
      data: {
        ...(dto.unitId !== undefined ? { unitId: dto.unitId ?? null } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() ?? null } : {}),
        ...(dto.content !== undefined ? { content: (dto.content as object) ?? null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async removeContentLesson(id: number) {
    await this.findContentLesson(id);
    await this.prisma.contentLesson.delete({ where: { id } });
    return { ok: true };
  }

  // ── Teacher access ────────────────────────────────────────────────────────

  listAccesses(teacherId?: number) {
    return this.prisma.teacherContentAccess.findMany({
      where: teacherId ? { teacherId } : {},
      orderBy: { grantedAt: 'desc' },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        granter: { select: { id: true, name: true } },
      },
    });
  }

  async grantAccess(
    grantedBy: number,
    dto: { teacherId: number; entityType: ContentEntityType; entityId: number; mode: TeacherAccessMode },
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
      select: { id: true, userRole: true },
    });
    if (!target || (target.userRole !== 'teacher' && target.userRole !== 'student')) {
      throw new BadRequestException('Матеріали можна присвоїти лише вчителю або учню');
    }
    const mode = target.userRole === 'student' ? TeacherAccessMode.readonly : dto.mode;

    return this.prisma.teacherContentAccess.upsert({
      where: {
        teacherId_entityType_entityId: {
          teacherId: dto.teacherId,
          entityType: dto.entityType,
          entityId: dto.entityId,
        },
      },
      create: {
        teacherId: dto.teacherId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        mode,
        grantedBy,
      },
      update: { mode, grantedBy },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        granter: { select: { id: true, name: true } },
      },
    });
  }

  async revokeAccess(id: number) {
    const item = await this.prisma.teacherContentAccess.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Доступ не знайдено');
    await this.prisma.teacherContentAccess.delete({ where: { id } });
    return { ok: true };
  }
}
