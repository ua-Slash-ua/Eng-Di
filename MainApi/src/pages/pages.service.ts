import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BlocksService } from '../blocks/blocks.service';
import { csvEnum, textFilter } from '../common/filters';
import { PrismaService } from '../prisma/prisma.service';
import { HOME_SLUG, isHomeSlug, normalizeSlug } from './page-slug';

export type PageListQuery = {
  q?: string;
  title?: string;
  slug?: string;
  /** Comma separated `ready` / `incomplete`. */
  seo?: string;
  page?: number;
  limit?: number;
};

/** A page counts as SEO-ready once both the meta title and description are filled. */
const SEO_READY: Prisma.PageWhereInput = {
  seo: { is: { title: { not: null }, description: { not: null } } },
};

const sectionInclude = {
  block: {
    select: {
      id: true,
      type: true,
      name: true,
      plaque: true,
      updatedAt: true,
    },
  },
} as const;

const pageInclude = {
  seo: true,
  sections: {
    orderBy: { sortOrder: 'asc' as const },
    include: sectionInclude,
  },
  _count: { select: { sections: true } },
};

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
  ) {}

  async list(query: PageListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 10));
    const and: Prisma.PageWhereInput[] = [];
    const q = query.q?.trim();
    if (q) {
      and.push({ OR: [{ title: { contains: q } }, { slug: { contains: q } }, { seo: { title: { contains: q } } }] });
    }
    const title = textFilter(query.title);
    if (title) {
      and.push({ OR: [{ title: { contains: title } }, { seo: { title: { contains: title } } }] });
    }
    const slug = textFilter(query.slug);
    if (slug) {
      and.push({ slug: { contains: slug } });
    }
    const seo = csvEnum(query.seo, ['ready', 'incomplete'] as const);
    if (seo && seo.length === 1) {
      and.push(seo[0] === 'ready' ? SEO_READY : { NOT: SEO_READY });
    }
    const where: Prisma.PageWhereInput = and.length ? { AND: and } : {};

    const [rows, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { seo: true, _count: { select: { sections: true } } },
      }),
      this.prisma.page.count({ where }),
    ]);

    return {
      items: rows,
      total,
      page,
      limit,
      pageCount: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.page.findUnique({
      where: { slug: normalizeSlug(slug) },
      include: {
        seo: true,
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: { block: { include: { meta: true } } },
        },
      },
    });
    if (!page) return null;

    const sections = await Promise.all(
      page.sections.map(async (section) => ({
        id: section.id,
        sortOrder: section.sortOrder,
        block: await this.blocks.presentPublic(section.block),
      })),
    );

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      seo: page.seo,
      sections,
    };
  }

  findById(id: number) {
    return this.prisma.page.findUnique({
      where: { id },
      include: pageInclude,
    });
  }

  async create(data: { slug: string; title: string }) {
    const slug = normalizeSlug(data.slug);
    if (isHomeSlug(data.slug) || slug === HOME_SLUG) {
      throw new BadRequestException('Slug / зарезервовано для головної сторінки');
    }
    const existing = await this.prisma.page.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Сторінка з таким slug вже існує');
    }
    const title = data.title.trim();
    return this.prisma.page.create({
      data: {
        slug,
        title,
        seo: { create: { title } },
      },
      include: pageInclude,
    });
  }

  async update(
    id: number,
    data: {
      slug?: string;
      title?: string;
      seo?: { title?: string; description?: string; keywords?: string };
    },
  ) {
    const existing = await this.prisma.page.findUnique({ where: { id }, include: { seo: true } });
    if (!existing) {
      throw new NotFoundException('Сторінку не знайдено');
    }
    if (existing.slug === HOME_SLUG && data.slug && normalizeSlug(data.slug) !== HOME_SLUG) {
      throw new BadRequestException('Адресу головної сторінки змінювати не можна');
    }
    const nextSlug = data.slug ? normalizeSlug(data.slug) : undefined;
    if (nextSlug && nextSlug !== existing.slug) {
      if (nextSlug === HOME_SLUG) {
        throw new BadRequestException('Slug / зарезервовано для головної сторінки');
      }
      const taken = await this.prisma.page.findUnique({ where: { slug: nextSlug } });
      if (taken) {
        throw new ConflictException('Сторінка з таким slug вже існує');
      }
    }

    return this.prisma.page.update({
      where: { id },
      data: {
        ...(nextSlug && nextSlug !== existing.slug ? { slug: nextSlug } : {}),
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.seo
          ? {
              seo: {
                upsert: {
                  create: {
                    title: data.seo.title ?? null,
                    description: data.seo.description ?? null,
                    keywords: data.seo.keywords ?? null,
                  },
                  update: {
                    ...(data.seo.title !== undefined ? { title: data.seo.title } : {}),
                    ...(data.seo.description !== undefined ? { description: data.seo.description } : {}),
                    ...(data.seo.keywords !== undefined ? { keywords: data.seo.keywords } : {}),
                  },
                },
              },
            }
          : {}),
      },
      include: pageInclude,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Сторінку не знайдено');
    }
    if (existing.slug === HOME_SLUG) {
      throw new BadRequestException('Головну сторінку видаляти не можна');
    }
    await this.prisma.page.delete({ where: { id } });
    return { ok: true };
  }

  async attachSection(pageId: number, blockId: number) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
      throw new NotFoundException('Сторінку не знайдено');
    }
    const block = await this.prisma.block.findUnique({ where: { id: blockId } });
    if (!block) {
      throw new NotFoundException('Блок не знайдено');
    }
    const already = await this.prisma.pageSection.findUnique({
      where: { pageId_blockId: { pageId, blockId } },
    });
    if (already) {
      throw new ConflictException('Цей блок уже додано на сторінку');
    }
    const last = await this.prisma.pageSection.findFirst({
      where: { pageId },
      orderBy: { sortOrder: 'desc' },
    });
    await this.prisma.pageSection.create({
      data: {
        pageId,
        blockId,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
    return this.findById(pageId);
  }

  async reorderSections(pageId: number, sectionIds: number[]) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
      throw new NotFoundException('Сторінку не знайдено');
    }
    const rows = await this.prisma.pageSection.findMany({ where: { pageId } });
    if (rows.length !== sectionIds.length) {
      throw new BadRequestException('Список секцій не збігається зі сторінкою');
    }
    const owned = new Set(rows.map((row) => row.id));
    if (sectionIds.some((id) => !owned.has(id))) {
      throw new BadRequestException('Є чужі секції в списку');
    }
    await this.prisma.$transaction(
      sectionIds.map((id, index) =>
        this.prisma.pageSection.update({
          where: { id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );
    return this.findById(pageId);
  }

  async detachSection(sectionId: number) {
    const section = await this.prisma.pageSection.findUnique({ where: { id: sectionId } });
    if (!section) {
      throw new NotFoundException('Секцію не знайдено');
    }
    const pageId = section.pageId;
    await this.prisma.pageSection.delete({ where: { id: sectionId } });
    return this.findById(pageId);
  }

  async usageByBlock(blockId: number) {
    const rows = await this.prisma.pageSection.findMany({
      where: { blockId },
      include: { page: { select: { id: true, title: true, slug: true } } },
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => ({
      id: row.page.id,
      name: row.page.title,
      type: row.page.slug,
    }));
  }
}
