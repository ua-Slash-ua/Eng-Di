import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { csvEnum, csvValues, textFilter } from '../common/filters';
import { PrismaService } from '../prisma/prisma.service';
import { HOME_SLUG, isHomeSlug } from '../pages/page-slug';

export type LeadListQuery = {
  q?: string;
  /** Comma separated statuses. */
  status?: string;
  /** Comma separated category slugs. */
  category?: string;
  lead?: string;
  location?: string;
  page?: number;
  limit?: number;
};

const LEAD_STATUSES = ['NEW', 'IN_PROGRESS', 'DONE'] as const;

function normalizeLocation(value?: string): string {
  const raw = value?.trim() || HOME_SLUG;
  if (isHomeSlug(raw)) {
    return HOME_SLUG;
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
}

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    phone: string;
    email?: string;
    message?: string;
    category?: string;
    location?: string;
  }) {
    const categorySlug = data.category?.trim() || 'site';
    const category = await this.prisma.leadCategory.findUnique({ where: { slug: categorySlug } });
    return this.prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        message: data.message,
        location: normalizeLocation(data.location),
        categoryId: category?.id ?? null,
      },
      include: { category: true },
    });
  }

  async list(query: LeadListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 10));
    const and: Prisma.LeadWhereInput[] = [];
    const statuses = csvEnum(query.status, LEAD_STATUSES);
    if (statuses) {
      and.push({ status: { in: statuses as LeadStatus[] } });
    }
    const categories = csvValues(query.category);
    if (categories) {
      and.push({ category: { slug: { in: categories } } });
    }
    const q = query.q?.trim();
    if (q) {
      and.push({
        OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
          { location: { contains: q } },
        ],
      });
    }
    const lead = textFilter(query.lead);
    if (lead) {
      and.push({ OR: [{ name: { contains: lead } }, { phone: { contains: lead } }, { email: { contains: lead } }] });
    }
    const location = textFilter(query.location);
    if (location) {
      and.push({ location: { contains: location } });
    }
    const where: Prisma.LeadWhereInput = and.length ? { AND: and } : {};

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pageCount: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: number) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: { category: true } });
    if (!lead) {
      throw new NotFoundException('Заявку не знайдено');
    }
    return lead;
  }

  async update(id: number, data: { status?: LeadStatus; categoryId?: number }) {
    await this.findById(id);
    if (data.categoryId) {
      const category = await this.prisma.leadCategory.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        throw new NotFoundException('Категорію не знайдено');
      }
    }
    return this.prisma.lead.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
      },
      include: { category: true },
    });
  }

  listCategories() {
    return this.prisma.leadCategory.findMany({
      orderBy: { title: 'asc' },
      include: { _count: { select: { leads: true } } },
    });
  }

  async createCategory(data: { slug: string; title: string }) {
    const slug = data.slug.trim().toLowerCase();
    const existing = await this.prisma.leadCategory.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Категорія з таким slug вже існує');
    }
    return this.prisma.leadCategory.create({
      data: { slug, title: data.title.trim() },
      include: { _count: { select: { leads: true } } },
    });
  }

  async updateCategory(id: number, data: { slug?: string; title?: string }) {
    const existing = await this.prisma.leadCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Категорію не знайдено');
    }
    if (data.slug && data.slug !== existing.slug) {
      const taken = await this.prisma.leadCategory.findUnique({ where: { slug: data.slug } });
      if (taken) {
        throw new ConflictException('Категорія з таким slug вже існує');
      }
    }
    return this.prisma.leadCategory.update({
      where: { id },
      data: {
        ...(data.slug ? { slug: data.slug.trim().toLowerCase() } : {}),
        ...(data.title ? { title: data.title.trim() } : {}),
      },
      include: { _count: { select: { leads: true } } },
    });
  }

  async removeCategory(id: number) {
    const existing = await this.prisma.leadCategory.findUnique({
      where: { id },
      include: { _count: { select: { leads: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Категорію не знайдено');
    }
    if (existing.slug === 'site') {
      throw new BadRequestException('Базову категорію видаляти не можна');
    }
    if (existing._count.leads > 0) {
      throw new BadRequestException('Спочатку перенесіть заявки в іншу категорію');
    }
    await this.prisma.leadCategory.delete({ where: { id } });
    return { ok: true };
  }
}
