import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, extname, join } from 'path';
import { csvNumbers, textFilter } from '../common/filters';
import { ListQuery, paginate, resolvePaging, searchTerm } from '../common/pagination';
import { resolveOrderBy } from '../common/sorting';
import { PrismaService } from '../prisma/prisma.service';
import {
  IMAGE_FORMAT_OPTIONS,
  mbToBytes,
  mimesForFormats,
} from '../settings/media-settings';
import { SettingsService } from '../settings/settings.service';

export type IconListQuery = ListQuery & {
  name?: string;
  slug?: string;
  type?: string;
  groupId?: string;
};

export type UploadMetaItem = {
  name?: string;
  alt?: string;
  slug?: string;
  groupId?: number | null;
};

const ICON_INCLUDE = {
  group: { select: { id: true, slug: true, title: true } },
} as const;

@Injectable()
export class IconsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  uploadsRoot() {
    return join(process.cwd(), 'uploads');
  }

  listGroups(type?: string) {
    return this.prisma.iconGroup.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { icons: true } } },
    });
  }

  async createGroup(data: { title: string; slug: string; type: string; sortOrder?: number }) {
    const type = data.type.trim() || 'svg';
    const last = await this.prisma.iconGroup.findFirst({
      where: { type },
      orderBy: { sortOrder: 'desc' },
    });
    return this.prisma.iconGroup.create({
      data: {
        title: data.title.trim(),
        slug: data.slug.trim().toLowerCase(),
        type,
        sortOrder: data.sortOrder ?? (last?.sortOrder ?? 0) + 1,
      },
      include: { _count: { select: { icons: true } } },
    });
  }

  async updateGroup(
    id: number,
    data: { title?: string; slug?: string; type?: string; sortOrder?: number },
  ) {
    await this.findGroup(id);
    return this.prisma.iconGroup.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.slug ? { slug: data.slug.trim().toLowerCase() } : {}),
        ...(data.type ? { type: data.type.trim() } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
      include: { _count: { select: { icons: true } } },
    });
  }

  async removeGroup(id: number) {
    await this.findGroup(id);
    const count = await this.prisma.icon.count({ where: { groupId: id } });
    if (count > 0) {
      throw new BadRequestException('Спочатку приберіть медіа з цієї групи');
    }
    await this.prisma.iconGroup.delete({ where: { id } });
    return { ok: true };
  }

  async findGroup(id: number) {
    const item = await this.prisma.iconGroup.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Групу не знайдено');
    }
    return item;
  }

  private async assertGroupType(groupId: number | null | undefined, mediaType: string) {
    if (groupId == null) {
      return;
    }
    const group = await this.findGroup(groupId);
    if (group.type !== mediaType) {
      throw new BadRequestException(`Група «${group.title}» належить до типу ${group.type}, а не ${mediaType}`);
    }
  }

  catalog(opts: { type?: string; groupId?: number } = {}) {
    const type = opts.type?.trim() || 'svg';
    return this.prisma.icon.findMany({
      where: {
        type,
        ...(opts.groupId ? { groupId: opts.groupId } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        svg: true,
        url: true,
        alt: true,
        groupId: true,
        group: { select: { id: true, slug: true, title: true } },
      },
    });
  }

  async listAdmin(query: IconListQuery) {
    const { page, limit, skip } = resolvePaging(query);
    const q = searchTerm(query.q);
    const and: Prisma.IconWhereInput[] = [];
    if (q) {
      and.push({
        OR: [
          { name: { contains: q } },
          { slug: { contains: q } },
          { alt: { contains: q } },
          { originalName: { contains: q } },
        ],
      });
    }
    const name = textFilter(query.name);
    if (name) {
      and.push({ name: { contains: name } });
    }
    const slug = textFilter(query.slug);
    if (slug) {
      and.push({ slug: { contains: slug } });
    }
    const type = textFilter(query.type);
    if (type) {
      and.push({ type });
    }
    const groupIds = csvNumbers(query.groupId);
    if (groupIds) {
      and.push({ groupId: { in: groupIds } });
    }
    const where: Prisma.IconWhereInput = and.length ? { AND: and } : {};
    const orderBy = resolveOrderBy<Prisma.IconOrderByWithRelationInput[]>(
      query,
      {
        name: (order) => [{ name: order }],
        slug: (order) => [{ slug: order }],
        type: (order) => [{ type: order }],
        sizeBytes: (order) => [{ sizeBytes: order }],
        sortOrder: (order) => [{ sortOrder: order }],
      },
      [{ sortOrder: 'asc' }, { id: 'asc' }],
    );

    const [items, total] = await Promise.all([
      this.prisma.icon.findMany({ where, orderBy, skip, take: limit, include: ICON_INCLUDE }),
      this.prisma.icon.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findById(id: number) {
    const item = await this.prisma.icon.findUnique({ where: { id }, include: ICON_INCLUDE });
    if (!item) {
      throw new NotFoundException('Медіа не знайдено');
    }
    return item;
  }

  async create(data: {
    name: string;
    slug: string;
    svg?: string;
    url?: string;
    alt?: string;
    mime?: string;
    sizeBytes?: number;
    originalName?: string;
    type?: string;
    groupId?: number | null;
    sortOrder?: number;
  }) {
    const type = data.type?.trim() || 'svg';
    if (type === 'svg' && !data.svg?.trim()) {
      throw new BadRequestException('Для SVG потрібен код');
    }
    if (type === 'image' && !data.url?.trim()) {
      throw new BadRequestException('Для зображення потрібен файл');
    }
    const last = await this.prisma.icon.findFirst({ orderBy: { sortOrder: 'desc' } });
    await this.assertGroupType(data.groupId, type);
    const slug = await this.uniqueSlug(data.slug.trim().toLowerCase());
    return this.prisma.icon.create({
      data: {
        name: data.name.trim(),
        slug,
        type,
        svg: data.svg?.trim() || null,
        url: data.url?.trim() || null,
        alt: data.alt?.trim() || null,
        mime: data.mime?.trim() || null,
        sizeBytes: data.sizeBytes ?? null,
        originalName: data.originalName?.trim() || null,
        groupId: data.groupId ?? null,
        sortOrder: data.sortOrder ?? (last?.sortOrder ?? 0) + 1,
      },
      include: ICON_INCLUDE,
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      slug?: string;
      svg?: string | null;
      url?: string | null;
      alt?: string | null;
      type?: string;
      groupId?: number | null;
      sortOrder?: number;
    },
  ) {
    const current = await this.findById(id);
    const nextType = data.type?.trim() || current.type;
    await this.assertGroupType(data.groupId, nextType);
    let slug: string | undefined;
    if (data.slug) {
      slug = await this.uniqueSlug(data.slug.trim().toLowerCase(), id);
    }
    return this.prisma.icon.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(slug ? { slug } : {}),
        ...(data.svg !== undefined ? { svg: data.svg?.trim() || null } : {}),
        ...(data.url !== undefined ? { url: data.url?.trim() || null } : {}),
        ...(data.alt !== undefined ? { alt: data.alt?.trim() || null } : {}),
        ...(data.type ? { type: data.type.trim() } : {}),
        ...(data.groupId !== undefined ? { groupId: data.groupId } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
      include: ICON_INCLUDE,
    });
  }

  async remove(id: number) {
    const item = await this.findById(id);
    await this.prisma.icon.delete({ where: { id } });
    if (item.url) {
      await this.deleteUploadFile(item.url);
    }
    return { ok: true };
  }

  async removeMany(ids: number[]) {
    const uniqueIds = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
    if (!uniqueIds.length) {
      throw new BadRequestException('Оберіть хоча б один запис');
    }
    const items = await this.prisma.icon.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, url: true },
    });
    if (!items.length) {
      return { ok: true, deleted: 0 };
    }
    await this.prisma.icon.deleteMany({ where: { id: { in: items.map((item) => item.id) } } });
    await Promise.all(items.map((item) => (item.url ? this.deleteUploadFile(item.url) : Promise.resolve())));
    return { ok: true, deleted: items.length };
  }

  async uploadImages(
    files: Express.Multer.File[],
    meta: UploadMetaItem[] = [],
    defaultGroupId?: number | null,
  ) {
    if (!files?.length) {
      throw new BadRequestException('Оберіть хоча б один файл');
    }
    if (defaultGroupId != null) {
      await this.assertGroupType(defaultGroupId, 'image');
    }

    const media = await this.settings.getMediaSettings();
    const allowedMimes = new Set(mimesForFormats(IMAGE_FORMAT_OPTIONS, media.imageFormats));
    const maxBytes = mbToBytes(media.maxImageMb);

    const created = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      if (!allowedMimes.has(file.mimetype)) {
        throw new BadRequestException(
          `Непідтримуваний тип: ${file.originalname}. Дозволено: ${media.imageFormats.join(', ').toUpperCase()}`,
        );
      }
      if (file.size > maxBytes) {
        throw new BadRequestException(
          `Файл «${file.originalname}» перевищує ліміт ${media.maxImageMb} МБ`,
        );
      }
      const itemMeta = meta[index] ?? {};
      const baseName = (itemMeta.name || stripExt(file.originalname) || `image-${index + 1}`).trim();
      const slugBase = slugify(itemMeta.slug || baseName) || `image-${Date.now()}`;
      const url = await this.writeUpload(file);
      const row = await this.create({
        name: baseName.slice(0, 120),
        slug: slugBase,
        type: 'image',
        url,
        alt: itemMeta.alt?.trim() || baseName,
        mime: file.mimetype,
        sizeBytes: file.size,
        originalName: file.originalname,
        groupId: itemMeta.groupId !== undefined ? itemMeta.groupId : (defaultGroupId ?? null),
      });
      created.push(row);
    }
    return created;
  }

  private async writeUpload(file: Express.Multer.File) {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const folder = join('images', year, month, day);
    const ext = safeExt(file.originalname, file.mimetype);
    const hash = createHash('sha1').update(randomBytes(8)).digest('hex').slice(0, 12);
    const filename = `${Date.now()}-${hash}${ext}`;
    const relative = join(folder, filename);
    const absolute = join(this.uploadsRoot(), relative);
    await fs.mkdir(dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, file.buffer);
    return `/uploads/${relative.replace(/\\/g, '/')}`;
  }

  private async deleteUploadFile(url: string) {
    if (!url.startsWith('/uploads/')) {
      return;
    }
    const absolute = join(this.uploadsRoot(), url.replace(/^\/uploads\//, ''));
    try {
      await fs.unlink(absolute);
    } catch {
      /* missing file */
    }
  }

  private async uniqueSlug(base: string, excludeId?: number) {
    let slug = base.slice(0, 100) || `media-${Date.now()}`;
    let attempt = 0;
    while (true) {
      const existing = await this.prisma.icon.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) {
        return slug;
      }
      attempt += 1;
      slug = `${base.slice(0, 90)}-${attempt}`;
    }
  }
}

function stripExt(name: string) {
  return name.replace(/\.[^.]+$/, '');
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яіїєґ\s-]/gi, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function safeExt(original: string, mime: string) {
  const fromName = extname(original).toLowerCase();
  if (fromName && fromName.length <= 8) {
    return fromName;
  }
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  if (mime === 'image/bmp' || mime === 'image/x-ms-bmp') return '.bmp';
  if (mime === 'image/svg+xml') return '.svg';
  return '.bin';
}
