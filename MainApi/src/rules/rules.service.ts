import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { csvNumbers, textFilter } from '../common/filters';
import { ListQuery, paginate, resolvePaging, searchTerm } from '../common/pagination';
import { resolveOrderBy } from '../common/sorting';
import { PrismaService } from '../prisma/prisma.service';

export type RuleListQuery = ListQuery & {
  title?: string;
  accent?: string;
};

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.schoolRule.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  catalog() {
    return this.prisma.schoolRule.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        accent: true,
      },
    });
  }

  async pickForBlock(ids: number[], limit = 8) {
    const all = await this.list();
    const remaining = new Map(all.map((item) => [item.id, item]));
    const picked: typeof all = [];
    for (const id of ids) {
      const item = remaining.get(id);
      if (!item) continue;
      picked.push(item);
      remaining.delete(id);
      if (picked.length >= limit) return picked;
    }
    for (const item of all) {
      if (picked.length >= limit) break;
      if (!remaining.has(item.id)) continue;
      picked.push(item);
      remaining.delete(item.id);
    }
    return picked;
  }

  async listAdmin(query: RuleListQuery) {
    const { page, limit, skip } = resolvePaging(query);
    const q = searchTerm(query.q);
    const and: Prisma.SchoolRuleWhereInput[] = [];
    if (q) {
      and.push({ OR: [{ title: { contains: q } }, { description: { contains: q } }] });
    }
    const title = textFilter(query.title);
    if (title) {
      and.push({ title: { contains: title } });
    }
    const accent = csvNumbers(query.accent);
    if (accent) {
      and.push({ accent: { in: accent } });
    }
    const where: Prisma.SchoolRuleWhereInput = and.length ? { AND: and } : {};
    const orderBy = resolveOrderBy<Prisma.SchoolRuleOrderByWithRelationInput[]>(
      query,
      {
        title: (order) => [{ title: order }],
        accent: (order) => [{ accent: order }],
      },
      [{ sortOrder: 'asc' }, { id: 'asc' }],
    );

    const [items, total] = await Promise.all([
      this.prisma.schoolRule.findMany({ where, orderBy, skip, take: limit }),
      this.prisma.schoolRule.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findById(id: number) {
    const item = await this.prisma.schoolRule.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Правило не знайдено');
    }
    return item;
  }

  async create(data: { title: string; description: string; accent?: number; sortOrder?: number }) {
    const last = await this.prisma.schoolRule.findFirst({ orderBy: { sortOrder: 'desc' } });
    const nextOrder = (last?.sortOrder ?? 0) + 1;
    return this.prisma.schoolRule.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        accent: data.accent ?? ((nextOrder - 1) % 5) + 1,
        sortOrder: data.sortOrder ?? nextOrder,
      },
    });
  }

  async update(id: number, data: { title?: string; description?: string; accent?: number; sortOrder?: number }) {
    await this.findById(id);
    return this.prisma.schoolRule.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.accent !== undefined ? { accent: data.accent } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findById(id);
    await this.prisma.schoolRule.delete({ where: { id } });
    return { ok: true };
  }
}
