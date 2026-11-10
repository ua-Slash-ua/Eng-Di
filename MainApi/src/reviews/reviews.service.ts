import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListQuery, paginate, resolvePaging, searchTerm } from '../common/pagination';
import { csvEnum, csvNumbers, textFilter } from '../common/filters';
import { resolveOrderBy } from '../common/sorting';
import { PrismaService } from '../prisma/prisma.service';

export type ReviewListQuery = ListQuery & {
  author?: string;
  rating?: string;
  kind?: string;
  verified?: string;
};

const publishableWhere: Prisma.ReviewWhereInput = {
  OR: [{ kind: 'manual' }, { isVerified: true }],
};

const publicSelect = {
  id: true,
  quote: true,
  author: true,
  result: true,
  rating: true,
  sortOrder: true,
  userId: true,
} as const;

type PublicReviewRow = Prisma.ReviewGetPayload<{ select: typeof publicSelect }>;

function toPublicReview(row: PublicReviewRow) {
  return {
    id: row.id,
    quote: row.quote,
    author: row.author,
    result: row.result,
    rating: row.rating,
    sortOrder: row.sortOrder,
    isOfficialAccount: row.userId != null,
  };
}

function displayAuthor(user: { name: string; firstName: string | null; lastName: string | null }) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length ? parts.join(' ').trim() : user.name.trim();
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic() {
    return this.prisma.review
      .findMany({
        where: publishableWhere,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: publicSelect,
      })
      .then((rows) => rows.map(toPublicReview));
  }

  catalog() {
    return this.prisma.review
      .findMany({
        where: publishableWhere,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          quote: true,
          author: true,
          result: true,
          rating: true,
          kind: true,
          isVerified: true,
        },
      });
  }

  listPublishable() {
    return this.prisma.review.findMany({
      where: publishableWhere,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async pickForBlock(ids: number[], limit?: number) {
    const all = await this.listPublishable();
    if (ids.length) {
      const byId = new Map(all.map((item) => [item.id, item]));
      const picked = ids
        .map((id) => byId.get(id))
        .filter((item): item is (typeof all)[number] => Boolean(item))
        .map((row) => toPublicReview(row));
      return limit !== undefined ? picked.slice(0, limit) : picked;
    }
    const mapped = all.map((row) => toPublicReview(row));
    return limit !== undefined ? mapped.slice(0, limit) : mapped;
  }

  async listAdmin(query: ReviewListQuery) {
    const { page, limit, skip } = resolvePaging(query);
    const q = searchTerm(query.q);
    const and: Prisma.ReviewWhereInput[] = [];
    if (q) {
      and.push({ OR: [{ quote: { contains: q } }, { author: { contains: q } }, { result: { contains: q } }] });
    }
    const author = textFilter(query.author);
    if (author) {
      and.push({
        OR: [{ author: { contains: author } }, { quote: { contains: author } }, { result: { contains: author } }],
      });
    }
    const rating = csvNumbers(query.rating);
    if (rating) {
      and.push({ rating: { in: rating } });
    }
    const kinds = csvEnum(query.kind, ['manual', 'user'] as const);
    if (kinds) {
      and.push({ kind: { in: kinds } });
    }
    const verified = query.verified?.split(',').map((item) => item.trim()).filter(Boolean);
    if (verified?.length) {
      const or: Prisma.ReviewWhereInput[] = [];
      if (verified.includes('true')) {
        or.push({ isVerified: true });
      }
      if (verified.includes('false')) {
        or.push({ isVerified: false, kind: 'user' });
      }
      if (verified.includes('pending')) {
        or.push({ isVerified: false, kind: 'user' });
      }
      if (or.length) {
        and.push({ OR: or });
      }
    }
    const where: Prisma.ReviewWhereInput = and.length ? { AND: and } : {};
    const orderBy = resolveOrderBy<Prisma.ReviewOrderByWithRelationInput[]>(
      query,
      {
        author: (order) => [{ author: order }],
        rating: (order) => [{ rating: order }],
      },
      [{ sortOrder: 'asc' }, { id: 'asc' }],
    );

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          teacher: { select: { id: true, name: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findById(id: number) {
    const item = await this.prisma.review.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!item) {
      throw new NotFoundException('Відгук не знайдено');
    }
    return item;
  }

  async create(data: { quote: string; author: string; result: string; rating?: number; sortOrder?: number }) {
    const last = await this.prisma.review.findFirst({ orderBy: { sortOrder: 'desc' } });
    return this.prisma.review.create({
      data: {
        quote: data.quote.trim(),
        author: data.author.trim(),
        result: data.result.trim(),
        rating: data.rating ?? 5,
        kind: 'manual',
        isVerified: true,
        sortOrder: data.sortOrder ?? (last?.sortOrder ?? 0) + 1,
      },
    });
  }

  async update(
    id: number,
    data: {
      quote?: string;
      author?: string;
      result?: string;
      rating?: number;
      sortOrder?: number;
      target?: 'school' | 'teacher';
    },
  ) {
    const existing = await this.findById(id);
    return this.prisma.review.update({
      where: { id },
      data: {
        ...(data.quote ? { quote: data.quote.trim() } : {}),
        ...(data.author ? { author: data.author.trim() } : {}),
        ...(data.result ? { result: data.result.trim() } : {}),
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.target !== undefined ? { target: data.target } : {}),
        ...(existing.kind === 'manual' ? {} : {}),
      },
    });
  }

  async verify(id: number, isVerified: boolean) {
    const item = await this.findById(id);
    if (item.kind !== 'user') {
      throw new BadRequestException('Верифікувати можна лише відгуки користувачів');
    }
    return this.prisma.review.update({
      where: { id },
      data: { isVerified },
    });
  }

  async remove(id: number) {
    await this.findById(id);
    await this.prisma.review.delete({ where: { id } });
    return { ok: true };
  }

  listTeachers() {
    return this.prisma.user.findMany({
      where: { userRole: 'teacher', status: 'active' },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true },
    });
  }

  listMine(userId: number) {
    return this.prisma.review.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      include: {
        teacher: { select: { id: true, name: true } },
      },
    });
  }

  private async resolveTeacherId(target: 'school' | 'teacher', teacherId?: number | null) {
    if (target !== 'teacher') {
      return null;
    }
    if (!teacherId) {
      throw new BadRequestException('Оберіть вчителя для відгуку');
    }
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.userRole !== 'teacher') {
      throw new BadRequestException('Обраний вчитель не знайдений');
    }
    return teacherId;
  }

  private async assertUniqueUserReview(
    userId: number,
    target: 'school' | 'teacher',
    teacherId: number | null,
    excludeReviewId?: number,
  ) {
    const existing = await this.prisma.review.findFirst({
      where: {
        userId,
        kind: 'user',
        target,
        teacherId: target === 'teacher' ? teacherId : null,
        ...(excludeReviewId ? { NOT: { id: excludeReviewId } } : {}),
      },
    });
    if (existing) {
      if (target === 'school') {
        throw new BadRequestException('Ви вже залишили відгук про школу');
      }
      throw new BadRequestException('Ви вже залишили відгук про цього вчителя');
    }
  }

  async createForUser(
    userId: number,
    data: { target: 'school' | 'teacher'; teacherId?: number; quote: string; result: string; rating: number },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    const resolvedTeacherId = await this.resolveTeacherId(data.target, data.teacherId);
    await this.assertUniqueUserReview(userId, data.target, resolvedTeacherId);
    const last = await this.prisma.review.findFirst({ orderBy: { sortOrder: 'desc' } });
    return this.prisma.review.create({
      data: {
        quote: data.quote.trim(),
        author: displayAuthor(user),
        result: data.result.trim(),
        rating: data.rating,
        kind: 'user',
        target: data.target,
        userId,
        teacherId: resolvedTeacherId,
        isVerified: false,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
      include: {
        teacher: { select: { id: true, name: true } },
      },
    });
  }

  async updateForUser(
    userId: number,
    reviewId: number,
    data: {
      target?: 'school' | 'teacher';
      teacherId?: number | null;
      quote?: string;
      result?: string;
      rating?: number;
    },
  ) {
    const item = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!item || item.userId !== userId) {
      throw new NotFoundException('Відгук не знайдено');
    }
    if (item.kind !== 'user') {
      throw new ForbiddenException('Цей відгук не можна редагувати');
    }
    const target = data.target ?? item.target;
    const teacherId =
      target === 'teacher'
        ? await this.resolveTeacherId(target, data.teacherId ?? item.teacherId)
        : null;
    await this.assertUniqueUserReview(userId, target, teacherId, reviewId);
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(data.quote !== undefined ? { quote: data.quote.trim() } : {}),
        ...(data.result !== undefined ? { result: data.result.trim() } : {}),
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.target !== undefined ? { target: data.target } : {}),
        teacherId,
        isVerified: false,
      },
      include: {
        teacher: { select: { id: true, name: true } },
      },
    });
  }

  async removeForUser(userId: number, reviewId: number) {
    const item = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!item || item.userId !== userId) {
      throw new NotFoundException('Відгук не знайдено');
    }
    if (item.kind !== 'user') {
      throw new ForbiddenException('Цей відгук не можна видалити');
    }
    await this.prisma.review.delete({ where: { id: reviewId } });
    return { ok: true };
  }
}
