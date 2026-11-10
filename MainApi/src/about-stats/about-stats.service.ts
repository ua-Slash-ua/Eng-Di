import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListQuery, paginate, resolvePaging, searchTerm } from '../common/pagination';
import { textFilter } from '../common/filters';
import { resolveOrderBy } from '../common/sorting';
import { PrismaService } from '../prisma/prisma.service';

export type AboutStatListQuery = ListQuery & {
  category?: string;
  value?: string;
  label?: string;
  icon?: string;
};

@Injectable()
export class AboutStatsService {
  constructor(private readonly prisma: PrismaService) {}

  list(category?: string) {
    return this.prisma.aboutStat.findMany({
      where: category ? { category: { slug: category } } : undefined,
      include: { category: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async listAdmin(query: AboutStatListQuery) {
    const { page, limit, skip } = resolvePaging(query);
    const q = searchTerm(query.q);
    const and: Prisma.AboutStatWhereInput[] = [];
    if (query.category) {
      and.push({ category: { slug: query.category } });
    }
    if (q) {
      and.push({ OR: [{ value: { contains: q } }, { label: { contains: q } }] });
    }
    const value = textFilter(query.value);
    if (value) {
      and.push({ value: { contains: value } });
    }
    const label = textFilter(query.label);
    if (label) {
      and.push({ label: { contains: label } });
    }
    const icon = textFilter(query.icon);
    if (icon) {
      and.push({ icon: { contains: icon } });
    }
    const where: Prisma.AboutStatWhereInput = and.length ? { AND: and } : {};

    const orderBy = resolveOrderBy<Prisma.AboutStatOrderByWithRelationInput[]>(
      query,
      {
        value: (order) => [{ value: order }],
        label: (order) => [{ label: order }],
        icon: (order) => [{ icon: order }],
      },
      [{ sortOrder: 'asc' }, { id: 'asc' }],
    );

    const [items, total] = await Promise.all([
      this.prisma.aboutStat.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.aboutStat.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async pickForBlock(ids: number[], limit = 3) {
    const all = await this.prisma.aboutStat.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    const remaining = new Map(all.map((item) => [item.id, item]));
    const picked: typeof all = [];
    for (const id of ids) {
      const item = remaining.get(id);
      if (!item) {
        continue;
      }
      picked.push(item);
      remaining.delete(id);
      if (picked.length >= limit) {
        return picked;
      }
    }
    for (const item of all) {
      if (picked.length >= limit) {
        break;
      }
      if (!remaining.has(item.id)) {
        continue;
      }
      picked.push(item);
      remaining.delete(item.id);
    }
    return picked;
  }

  async findById(id: number) {
    const item = await this.prisma.aboutStat.findUnique({ where: { id }, include: { category: true } });
    if (!item) {
      throw new NotFoundException('Запис не знайдено');
    }
    return item;
  }

  async create(data: { value: string; label: string; icon?: string; sortOrder?: number; categoryId?: number }) {
    const categoryId = data.categoryId ?? (await this.defaultCategoryId());
    await this.assertCategory(categoryId);
    const last = await this.prisma.aboutStat.findFirst({
      orderBy: { sortOrder: 'desc' },
    });
    return this.prisma.aboutStat.create({
      data: {
        value: data.value.trim(),
        label: data.label.trim(),
        icon: data.icon?.trim() || null,
        sortOrder: data.sortOrder ?? (last?.sortOrder ?? 0) + 1,
        categoryId,
      },
      include: { category: true },
    });
  }

  async update(
    id: number,
    data: { value?: string; label?: string; icon?: string; sortOrder?: number; categoryId?: number },
  ) {
    await this.findById(id);
    if (data.categoryId) {
      await this.assertCategory(data.categoryId);
    }
    return this.prisma.aboutStat.update({
      where: { id },
      data: {
        ...(data.value ? { value: data.value.trim() } : {}),
        ...(data.label ? { label: data.label.trim() } : {}),
        ...(data.icon !== undefined ? { icon: data.icon.trim() || null } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
      },
      include: { category: true },
    });
  }

  async remove(id: number) {
    await this.findById(id);
    await this.prisma.aboutStat.delete({ where: { id } });
    return { ok: true };
  }

  listCategories() {
    return this.prisma.aboutStatCategory.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { stats: true } } },
    });
  }

  async createCategory(data: { slug: string; title: string }) {
    const slug = data.slug.trim().toLowerCase();
    const existing = await this.prisma.aboutStatCategory.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Категорія з таким slug вже існує');
    }
    return this.prisma.aboutStatCategory.create({
      data: { slug, title: data.title.trim() },
      include: { _count: { select: { stats: true } } },
    });
  }

  async updateCategory(id: number, data: { slug?: string; title?: string }) {
    const existing = await this.prisma.aboutStatCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Категорію не знайдено');
    }
    if (data.slug && data.slug !== existing.slug) {
      if (existing.slug === 'hero' || existing.slug === 'about') {
        throw new BadRequestException('Slug базової категорії змінювати не можна');
      }
      const taken = await this.prisma.aboutStatCategory.findUnique({ where: { slug: data.slug } });
      if (taken) {
        throw new ConflictException('Категорія з таким slug вже існує');
      }
    }
    return this.prisma.aboutStatCategory.update({
      where: { id },
      data: {
        ...(data.slug ? { slug: data.slug.trim().toLowerCase() } : {}),
        ...(data.title ? { title: data.title.trim() } : {}),
      },
      include: { _count: { select: { stats: true } } },
    });
  }

  async removeCategory(id: number) {
    const existing = await this.prisma.aboutStatCategory.findUnique({
      where: { id },
      include: { _count: { select: { stats: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Категорію не знайдено');
    }
    if (existing.slug === 'hero' || existing.slug === 'about') {
      throw new BadRequestException('Базову категорію видаляти не можна');
    }
    if (existing._count.stats > 0) {
      throw new BadRequestException('Спочатку перенесіть або видаліть записи');
    }
    await this.prisma.aboutStatCategory.delete({ where: { id } });
    return { ok: true };
  }

  private async defaultCategoryId() {
    const about = await this.prisma.aboutStatCategory.findUnique({ where: { slug: 'about' } });
    if (about) {
      return about.id;
    }
    const first = await this.prisma.aboutStatCategory.findFirst({ orderBy: { id: 'asc' } });
    if (!first) {
      throw new NotFoundException('Категорію не знайдено');
    }
    return first.id;
  }

  private async assertCategory(id: number) {
    const category = await this.prisma.aboutStatCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Категорію не знайдено');
    }
  }
}
