import type { PrismaClient } from '@prisma/client';
import {
  LEAD_META_DEFAULTS,
  LEAD_PLAQUE_DEFAULT,
  LEAD_TITLE_DEFAULT,
} from '../../../blocks/block-types';

export async function seedLeadBlock(prisma: PrismaClient) {
  const existing = await prisma.block.findFirst({ where: { type: 'lead' } });
  if (existing) return;

  await prisma.block.create({
    data: {
      type: 'lead',
      name: 'Заявка — головна',
      plaque: LEAD_PLAQUE_DEFAULT,
      title: LEAD_TITLE_DEFAULT,
      meta: {
        create: Object.entries(LEAD_META_DEFAULTS).map(([key, value]) => ({ key, value })),
      },
    },
  });
}
