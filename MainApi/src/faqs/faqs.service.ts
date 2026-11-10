import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { textFilter } from '../common/filters';
import { ListQuery, paginate, resolvePaging, searchTerm } from '../common/pagination';
import { resolveOrderBy } from '../common/sorting';
import { PrismaService } from '../prisma/prisma.service';

export type FaqListQuery = ListQuery & {
  question?: string;
};

@Injectable()
export class FaqsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.faq.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async listAdmin(query: FaqListQuery) {
    const { page, limit, skip } = resolvePaging(query);
    const q = searchTerm(query.q);
    const and: Prisma.FaqWhereInput[] = [];
    if (q) {
      and.push({ OR: [{ question: { contains: q } }, { answer: { contains: q } }] });
    }
    const question = textFilter(query.question);
    if (question) {
      and.push({ OR: [{ question: { contains: question } }, { answer: { contains: question } }] });
    }
    const where: Prisma.FaqWhereInput = and.length ? { AND: and } : {};
    const orderBy = resolveOrderBy<Prisma.FaqOrderByWithRelationInput[]>(
      query,
      {
        question: (order) => [{ question: order }],
      },
      [{ sortOrder: 'asc' }, { id: 'asc' }],
    );

    const [items, total] = await Promise.all([
      this.prisma.faq.findMany({ where, orderBy, skip, take: limit }),
      this.prisma.faq.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findById(id: number) {
    const item = await this.prisma.faq.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Питання не знайдено');
    }
    return item;
  }

  async create(data: { question: string; answer: string; sortOrder?: number }) {
    const last = await this.prisma.faq.findFirst({ orderBy: { sortOrder: 'desc' } });
    const nextOrder = (last?.sortOrder ?? 0) + 1;
    return this.prisma.faq.create({
      data: {
        question: data.question.trim(),
        answer: data.answer.trim(),
        sortOrder: data.sortOrder ?? nextOrder,
      },
    });
  }

  async update(id: number, data: { question?: string; answer?: string; sortOrder?: number }) {
    await this.findById(id);
    return this.prisma.faq.update({
      where: { id },
      data: {
        ...(data.question ? { question: data.question.trim() } : {}),
        ...(data.answer ? { answer: data.answer.trim() } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findById(id);
    await this.prisma.faq.delete({ where: { id } });
    return { ok: true };
  }
}
