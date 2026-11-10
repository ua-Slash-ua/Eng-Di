import type { PrismaClient } from '@prisma/client';
import { HERO_META_DEFAULTS, HERO_PLAQUE_DEFAULT, HERO_TITLE_DEFAULT } from '../../../blocks/block-types';

export async function seedBlocks(prisma: PrismaClient) {
  if ((await prisma.block.count()) > 0) {
    return;
  }
  const heroStats = await prisma.aboutStat.findMany({
    where: { category: { slug: 'hero' } },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    take: 3,
  });
  const fallback =
    heroStats.length > 0
      ? heroStats
      : await prisma.aboutStat.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], take: 3 });
  await prisma.block.create({
    data: {
      type: 'hero',
      name: 'Герой головної',
      plaque: HERO_PLAQUE_DEFAULT,
      title: HERO_TITLE_DEFAULT,
      meta: {
        create: Object.entries({
          ...HERO_META_DEFAULTS,
          stat_ids: JSON.stringify(fallback.map((item) => item.id)),
        }).map(([key, value]) => ({ key, value })),
      },
    },
  });
}
