import type { PrismaClient } from '@prisma/client';
import {
  PRICING_META_DEFAULTS,
  PRICING_PLAQUE_DEFAULT,
  PRICING_TITLE_DEFAULT,
} from '../../../blocks/block-types';

export async function seedPricingBlock(prisma: PrismaClient) {
  const existing = await prisma.block.findFirst({ where: { type: 'pricing' } });
  if (existing) return;

  const tariffs = await prisma.tariff.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    take: 6,
  });

  await prisma.block.create({
    data: {
      type: 'pricing',
      name: 'Пакети — головна',
      plaque: PRICING_PLAQUE_DEFAULT,
      title: PRICING_TITLE_DEFAULT,
      meta: {
        create: Object.entries({
          ...PRICING_META_DEFAULTS,
          tariff_ids: JSON.stringify(tariffs.map((item) => item.id)),
        }).map(([key, value]) => ({ key, value })),
      },
    },
  });
}
