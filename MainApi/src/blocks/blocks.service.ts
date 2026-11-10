import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AboutStatsService } from '../about-stats/about-stats.service';
import { textFilter } from '../common/filters';
import { ListQuery, paginate, resolvePaging, searchTerm } from '../common/pagination';
import { resolveOrderBy } from '../common/sorting';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewsService } from '../reviews/reviews.service';
import { RulesService } from '../rules/rules.service';
import { TariffsService } from '../tariffs/tariffs.service';
import {
  BLOCK_META_KEYS,
  BlockTypeSlug,
  isBlockType,
} from './block-types';
import { sanitizeRichText } from './rich-text';

type BlockRow = Prisma.BlockGetPayload<{ include: { meta: true } }>;

export type BlockListQuery = ListQuery & {
  type?: string;
  name?: string;
  plaque?: string;
};

@Injectable()
export class BlocksService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AboutStatsService))
    private readonly aboutStats: AboutStatsService,
    private readonly tariffs: TariffsService,
    private readonly rules: RulesService,
    private readonly reviews: ReviewsService,
  ) {}

  async list(type?: string) {
    const rows = await this.prisma.block.findMany({
      where: type ? { type } : undefined,
      include: { meta: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => this.present(row));
  }

  catalog() {
    return this.prisma.block.findMany({
      orderBy: [{ type: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        type: true,
        name: true,
        plaque: true,
      },
    });
  }

  async listAdmin(query: BlockListQuery) {
    const { page, limit, skip } = resolvePaging(query);
    const q = searchTerm(query.q);
    const and: Prisma.BlockWhereInput[] = [];
    if (query.type) {
      and.push({ type: query.type });
    }
    if (q) {
      and.push({ OR: [{ name: { contains: q } }, { plaque: { contains: q } }, { title: { contains: q } }] });
    }
    const name = textFilter(query.name);
    if (name) {
      and.push({ name: { contains: name } });
    }
    const plaque = textFilter(query.plaque);
    if (plaque) {
      and.push({ plaque: { contains: plaque } });
    }
    const where: Prisma.BlockWhereInput = and.length ? { AND: and } : {};

    const orderBy = resolveOrderBy<Prisma.BlockOrderByWithRelationInput[]>(
      query,
      {
        name: (order) => [{ name: order }],
        plaque: (order) => [{ plaque: order }],
        updatedAt: (order) => [{ updatedAt: order }],
      },
      [{ id: 'asc' }],
    );

    const [rows, total] = await Promise.all([
      this.prisma.block.findMany({
        where,
        include: { meta: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.block.count({ where }),
    ]);

    return paginate(
      rows.map((row) => this.present(row)),
      total,
      page,
      limit,
    );
  }

  async listPublic(type?: string) {
    const rows = await this.prisma.block.findMany({
      where: type ? { type } : undefined,
      include: { meta: true },
      orderBy: { id: 'asc' },
    });
    return Promise.all(rows.map((row) => this.presentPublic(row)));
  }

  async findById(id: number, resolve = false) {
    const row = await this.prisma.block.findUnique({
      where: { id },
      include: { meta: true },
    });
    if (!row) {
      throw new NotFoundException('Блок не знайдено');
    }
    return resolve ? this.presentPublic(row) : this.present(row);
  }

  async create(data: { name: string; type: BlockTypeSlug }) {
    const row = await this.prisma.block.create({
      data: {
        type: data.type,
        name: data.name.trim(),
        plaque: null,
        title: '',
      },
      include: { meta: true },
    });
    return this.present(row);
  }

  async update(
    id: number,
    data: { type?: BlockTypeSlug; name?: string; plaque?: string; title?: string; meta?: Record<string, string> },
  ) {
    const existing = await this.prisma.block.findUnique({ where: { id }, include: { meta: true } });
    if (!existing) {
      throw new NotFoundException('Блок не знайдено');
    }
    if (!isBlockType(existing.type)) {
      throw new BadRequestException('Невідомий тип блоку');
    }

    const nextType = data.type ?? existing.type;
    if (!isBlockType(nextType)) {
      throw new BadRequestException('Невідомий тип блоку');
    }
    const typeChanged = nextType !== existing.type;
    const allowedKeys = new Set(BLOCK_META_KEYS[nextType]);
    const metaEntries = Object.entries(data.meta ?? {}).filter(([key]) => allowedKeys.has(key));

    await this.prisma.$transaction(async (tx) => {
      await tx.block.update({
        where: { id },
        data: {
          ...(typeChanged ? { type: nextType } : {}),
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.plaque !== undefined ? { plaque: data.plaque.trim() || null } : {}),
          ...(data.title !== undefined ? { title: sanitizeRichText(data.title) } : {}),
        },
      });

      if (typeChanged) {
        await tx.blockMeta.deleteMany({ where: { blockId: id } });
      }

      for (const [key, raw] of metaEntries) {
        const value = this.normalizeMeta(nextType, key, raw);
        await tx.blockMeta.upsert({
          where: { blockId_key: { blockId: id, key } },
          create: { blockId: id, key, value },
          update: { value },
        });
      }
    });

    return this.findById(id);
  }

  async remove(id: number) {
    await this.findById(id);
    await this.prisma.block.delete({ where: { id } });
    return { ok: true };
  }

  async usageByRecord(key: string, recordId: number) {
    const rows = await this.prisma.block.findMany({
      where: { meta: { some: { key } } },
      include: { meta: true },
      orderBy: { id: 'asc' },
    });
    return rows
      .filter((row) => parseStatIds(row.meta.find((entry) => entry.key === key)?.value).includes(recordId))
      .map((row) => ({ id: row.id, name: row.name, type: row.type }));
  }

  async usage(id: number) {
    await this.findById(id);
    const rows = await this.prisma.pageSection.findMany({
      where: { blockId: id },
      include: { page: { select: { id: true, title: true, slug: true } } },
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => ({
      id: row.page.id,
      name: row.page.title,
      type: row.page.slug,
    }));
  }

  private present(row: BlockRow) {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      plaque: row.plaque ?? '',
      title: sanitizeRichText(row.title ?? ''),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      meta: Object.fromEntries(row.meta.map((item) => [item.key, item.value])),
    };
  }

  async presentPublic(row: BlockRow) {
    const block = this.present(row);
    if (row.type === 'hero' || row.type === 'about') {
      const ids = parseStatIds(block.meta.stat_ids);
      const stats = await this.aboutStats.pickForBlock(ids, 3);
      return { ...block, stats };
    }
    if (row.type === 'pricing') {
      const ids = parseStatIds(block.meta.tariff_ids);
      const tariffs = await this.tariffs.pickForBlock(ids, 6);
      return { ...block, tariffs };
    }
    if (row.type === 'rules') {
      const ids = parseStatIds(block.meta.rule_ids);
      const rules = await this.rules.pickForBlock(ids, 8);
      return { ...block, rules };
    }
    if (row.type === 'reviews') {
      const ids = parseStatIds(block.meta.review_ids);
      const reviews = await this.reviews.pickForBlock(ids);
      return { ...block, reviews };
    }
    return block;
  }

  private normalizeMeta(type: BlockTypeSlug, key: string, raw: string): string {
    const value = String(raw ?? '');
    if ((type === 'hero' || type === 'about') && key === 'stat_ids') {
      return JSON.stringify(parseStatIds(value).slice(0, 3));
    }
    if (type === 'pricing' && key === 'tariff_ids') {
      return JSON.stringify(parseStatIds(value).slice(0, 6));
    }
    if (type === 'rules' && key === 'rule_ids') {
      return JSON.stringify(parseStatIds(value).slice(0, 8));
    }
    if (type === 'reviews' && key === 'review_ids') {
      return JSON.stringify(parseStatIds(value));
    }
    if (type === 'levels' && key === 'levels') {
      return JSON.stringify(parseLevels(value));
    }
    if (type === 'formats' && key === 'formats') {
      return JSON.stringify(parseFormatItems(value));
    }
    if (key.endsWith('_href')) {
      return sanitizeHref(value);
    }
    if (key === 'photo_url') {
      return sanitizePhotoUrl(value);
    }
    return value.trim();
  }
}

const LIST_ITEMS_LIMIT = 30;

function parseLevels(value?: string) {
  try {
    const parsed = JSON.parse(value ?? '') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, LIST_ITEMS_LIMIT)
      .map((item) => {
        const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
        return {
          code: String(row.code ?? '').trim().slice(0, 12),
          title: String(row.title ?? '').trim().slice(0, 80),
          description: String(row.description ?? '').trim().slice(0, 160),
        };
      })
      .filter((row) => row.code || row.title || row.description);
  } catch {
    return [];
  }
}

function parseFormatItems(value?: string) {
  try {
    const parsed = JSON.parse(value ?? '') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, LIST_ITEMS_LIMIT)
      .map((item) => {
        const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
        const accentRaw = Number(row.accent);
        return {
          icon: String(row.icon ?? '').trim().slice(0, 16),
          title: String(row.title ?? '').trim().slice(0, 120),
          description: String(row.description ?? '').trim().slice(0, 320),
          accent: accentRaw === 2 || accentRaw === 3 ? accentRaw : 1,
        };
      })
      .filter((row) => row.icon || row.title || row.description);
  } catch {
    return [];
  }
}

export function parseStatIds(value?: string): number[] {
  if (!value?.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => Number(item)).filter((id) => Number.isInteger(id) && id > 0);
    }
  } catch {
    /* comma-separated fallback */
  }
  return value
    .split(/[,\s]+/)
    .map((item) => Number(item))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function sanitizeHref(value: string): string {
  const href = value.trim();
  if (!href) {
    return '#lead-form';
  }
  if (href.startsWith('#') || href.startsWith('/')) {
    return href;
  }
  try {
    const url = new URL(href);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch {
    /* ignore */
  }
  return '#lead-form';
}

function sanitizePhotoUrl(value: string): string {
  const url = value.trim();
  if (!url) {
    return '';
  }
  if (url.startsWith('/')) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    /* ignore */
  }
  return '';
}
