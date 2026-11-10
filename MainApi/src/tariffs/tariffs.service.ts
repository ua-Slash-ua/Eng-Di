import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListQuery, paginate, resolvePaging, searchTerm } from '../common/pagination';
import { csvValues, textFilter } from '../common/filters';
import { resolveOrderBy } from '../common/sorting';
import { DEFAULT_TARIFF_ICON } from '../database/startup/iconSvgs';
import { PrismaService } from '../prisma/prisma.service';

export type TariffListQuery = ListQuery & {
  title?: string;
  variant?: string;
};

@Injectable()
export class TariffsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.tariff.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  catalog() {
    return this.prisma.tariff.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        lessons: true,
        price: true,
        popular: true,
        icon: true,
        variant: true,
      },
    });
  }

  async pickForBlock(ids: number[], limit = 6) {
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

  async listAdmin(query: TariffListQuery) {
    const { page, limit, skip } = resolvePaging(query);
    const q = searchTerm(query.q);
    const and: Prisma.TariffWhereInput[] = [];
    if (q) {
      and.push({ OR: [{ title: { contains: q } }, { note: { contains: q } }, { variant: { contains: q } }] });
    }
    const title = textFilter(query.title);
    if (title) {
      and.push({ title: { contains: title } });
    }
    const variant = csvValues(query.variant);
    if (variant) {
      and.push({ variant: { in: variant } });
    }
    const where: Prisma.TariffWhereInput = and.length ? { AND: and } : {};
    const orderBy = resolveOrderBy<Prisma.TariffOrderByWithRelationInput[]>(
      query,
      {
        title: (order) => [{ title: order }],
        price: (order) => [{ price: order }],
        lessons: (order) => [{ lessons: order }],
        variant: (order) => [{ variant: order }],
      },
      [{ sortOrder: 'asc' }, { id: 'asc' }],
    );

    const [items, total] = await Promise.all([
      this.prisma.tariff.findMany({ where, orderBy, skip, take: limit }),
      this.prisma.tariff.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findById(id: number) {
    const item = await this.prisma.tariff.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Тариф не знайдено');
    }
    return item;
  }

  async create(data: {
    title: string;
    lessons: number;
    price: number;
    oldPrice?: number | null;
    popular?: boolean;
    note: string;
    variant?: string;
    icon?: string;
    sortOrder?: number;
    lessonPrice?: number;
    installmentCount?: number;
    durationMonths?: number;
    frozenLessonsPerMonth?: number;
  }) {
    const last = await this.prisma.tariff.findFirst({ orderBy: { sortOrder: 'desc' } });
    const nextOrder = (last?.sortOrder ?? 0) + 1;
    if (data.popular) {
      await this.clearPopular();
    }
    const payment = this.resolvePayment(data.installmentCount);
    return this.prisma.tariff.create({
      data: {
        title: data.title.trim(),
        lessons: data.lessons,
        price: data.price,
        oldPrice: this.nullablePrice(data.oldPrice),
        popular: Boolean(data.popular),
        note: data.note.trim(),
        variant: data.variant || 'start',
        icon: data.icon?.trim() || DEFAULT_TARIFF_ICON,
        sortOrder: data.sortOrder ?? nextOrder,
        lessonPrice: this.resolveLessonPrice(data.price, data.lessons, data.lessonPrice),
        paymentMode: payment.paymentMode,
        installmentCount: payment.installmentCount,
        durationMonths: data.durationMonths && data.durationMonths > 0 ? data.durationMonths : 1,
        frozenLessonsPerMonth: Math.max(0, data.frozenLessonsPerMonth ?? 0),
      },
    });
  }

  async update(
    id: number,
    data: {
      title?: string;
      lessons?: number;
      price?: number;
      oldPrice?: number | null;
      popular?: boolean;
      note?: string;
      variant?: string;
      icon?: string;
      sortOrder?: number;
      lessonPrice?: number;
      installmentCount?: number;
      durationMonths?: number;
      frozenLessonsPerMonth?: number;
    },
  ) {
    const existing = await this.findById(id);
    if (data.popular) {
      await this.clearPopular(id);
    }
    const nextLessons = data.lessons ?? existing.lessons;
    const nextPrice = data.price ?? existing.price;
    const payment =
      data.installmentCount !== undefined ? this.resolvePayment(data.installmentCount) : null;
    return this.prisma.tariff.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.lessons !== undefined ? { lessons: data.lessons } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.oldPrice !== undefined ? { oldPrice: this.nullablePrice(data.oldPrice) } : {}),
        ...(data.popular !== undefined ? { popular: data.popular } : {}),
        ...(data.note ? { note: data.note.trim() } : {}),
        ...(data.variant ? { variant: data.variant } : {}),
        ...(data.icon !== undefined ? { icon: data.icon.trim() || DEFAULT_TARIFF_ICON } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        lessonPrice: this.resolveLessonPrice(nextPrice, nextLessons, data.lessonPrice),
        ...(payment
          ? { paymentMode: payment.paymentMode, installmentCount: payment.installmentCount }
          : {}),
        ...(data.durationMonths !== undefined ? { durationMonths: Math.max(1, data.durationMonths) } : {}),
        ...(data.frozenLessonsPerMonth !== undefined
          ? { frozenLessonsPerMonth: Math.max(0, data.frozenLessonsPerMonth) }
          : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findById(id);
    const inUse = await this.prisma.userTariff.count({
      where: { tariffId: id, status: { in: ['active', 'scheduled'] } },
    });
    if (inUse) {
      throw new BadRequestException('Тариф не можна видалити: є активні або заплановані підписки');
    }
    await this.prisma.tariff.delete({ where: { id } });
    return { ok: true };
  }

  private resolvePayment(count?: number) {
    const parts = count != null && count >= 1 ? Math.floor(count) : 1;
    return {
      installmentCount: parts,
      paymentMode: parts <= 1 ? ('once' as const) : ('installments' as const),
    };
  }

  private resolveLessonPrice(price: number, lessons: number, explicit?: number) {
    if (explicit && explicit > 0) {
      return explicit;
    }
    if (!lessons) {
      return 0;
    }
    return Math.round(price / lessons);
  }

  private nullablePrice(value?: number | null) {
    if (value == null || value <= 0) {
      return null;
    }
    return value;
  }

  private clearPopular(exceptId?: number) {
    return this.prisma.tariff.updateMany({
      where: exceptId ? { id: { not: exceptId } } : undefined,
      data: { popular: false },
    });
  }
}
