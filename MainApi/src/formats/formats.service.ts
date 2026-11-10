import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { csvNumbers, textFilter } from '../common/filters';
import { ListQuery, paginate, resolvePaging, searchTerm } from '../common/pagination';
import { resolveOrderBy } from '../common/sorting';
import { PrismaService } from '../prisma/prisma.service';

export type FormatListQuery = ListQuery & {
  title?: string;
  icon?: string;
  accent?: string;
};

@Injectable()
export class FormatsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.format.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async listAdmin(query: FormatListQuery) {
    const { page, limit, skip } = resolvePaging(query);
    const q = searchTerm(query.q);
    const and: Prisma.FormatWhereInput[] = [];
    if (q) {
      and.push({ OR: [{ title: { contains: q } }, { description: { contains: q } }] });
    }
    const title = textFilter(query.title);
    if (title) {
      and.push({ title: { contains: title } });
    }
    const icon = textFilter(query.icon);
    if (icon) {
      and.push({ icon: { contains: icon } });
    }
    const accent = csvNumbers(query.accent);
    if (accent) {
      and.push({ accent: { in: accent } });
    }
    const where: Prisma.FormatWhereInput = and.length ? { AND: and } : {};
    const orderBy = resolveOrderBy<Prisma.FormatOrderByWithRelationInput[]>(
      query,
      {
        title: (order) => [{ title: order }],
        icon: (order) => [{ icon: order }],
        accent: (order) => [{ accent: order }],
      },
      [{ sortOrder: 'asc' }, { id: 'asc' }],
    );

    const [items, total] = await Promise.all([
      this.prisma.format.findMany({ where, orderBy, skip, take: limit }),
      this.prisma.format.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findById(id: number) {
    const item = await this.prisma.format.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Формат не знайдено');
    }
    return item;
  }

  async create(data: { title: string; description: string; icon?: string; accent?: number; sortOrder?: number }) {
    const last = await this.prisma.format.findFirst({ orderBy: { sortOrder: 'desc' } });
    const nextOrder = (last?.sortOrder ?? 0) + 1;
    return this.prisma.format.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        icon: data.icon?.trim() || null,
        accent: data.accent ?? ((nextOrder - 1) % 3) + 1,
        sortOrder: data.sortOrder ?? nextOrder,
      },
    });
  }

  async update(
    id: number,
    data: { title?: string; description?: string; icon?: string; accent?: number; sortOrder?: number },
  ) {
    await this.findById(id);
    return this.prisma.format.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.icon !== undefined ? { icon: data.icon.trim() || null } : {}),
        ...(data.accent !== undefined ? { accent: data.accent } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findById(id);
    await this.prisma.format.delete({ where: { id } });
    return { ok: true };
  }
}
