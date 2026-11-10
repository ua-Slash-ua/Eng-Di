import type { PrismaClient } from '@prisma/client';
import { CTA_META_DEFAULTS, CTA_TITLE_DEFAULT } from '../../../blocks/block-types';

export async function seedCtaBlock(prisma: PrismaClient) {
  const existing = await prisma.block.findFirst({ where: { type: 'cta' } });
  if (existing) return;

  await prisma.block.create({
    data: {
      type: 'cta',
      name: 'CTA — головна',
      plaque: null,
      title: CTA_TITLE_DEFAULT,
      meta: {
        create: Object.entries(CTA_META_DEFAULTS).map(([key, value]) => ({ key, value })),
      },
    },
  });
}
