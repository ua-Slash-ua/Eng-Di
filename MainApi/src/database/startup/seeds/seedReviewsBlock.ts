import type { PrismaClient } from '@prisma/client';
import {
  REVIEWS_META_DEFAULTS,
  REVIEWS_PLAQUE_DEFAULT,
  REVIEWS_TITLE_DEFAULT,
} from '../../../blocks/block-types';

export async function seedReviewsBlock(prisma: PrismaClient) {
  const existing = await prisma.block.findFirst({ where: { type: 'reviews' } });
  if (existing) return;

  const reviews = await prisma.review.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    take: 3,
  });

  await prisma.block.create({
    data: {
      type: 'reviews',
      name: 'Відгуки — головна',
      plaque: REVIEWS_PLAQUE_DEFAULT,
      title: REVIEWS_TITLE_DEFAULT,
      meta: {
        create: Object.entries({
          ...REVIEWS_META_DEFAULTS,
          review_ids: JSON.stringify(reviews.map((item) => item.id)),
        }).map(([key, value]) => ({ key, value })),
      },
    },
  });
}
