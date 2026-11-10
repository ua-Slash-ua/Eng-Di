import type { PrismaClient } from '@prisma/client';
import { ICON_GROUP_SEEDS, ICON_SEEDS, ICONS } from '../iconSvgs';

export async function seedIcons(prisma: PrismaClient) {
  for (const group of ICON_GROUP_SEEDS) {
    await prisma.iconGroup.upsert({
      where: { type_slug: { type: group.type, slug: group.slug } },
      create: {
        slug: group.slug,
        title: group.title,
        type: group.type,
        sortOrder: group.sortOrder,
      },
      update: { title: group.title, sortOrder: group.sortOrder },
    });
  }

  if ((await prisma.icon.count()) > 0) {
    return;
  }

  const groups = await prisma.iconGroup.findMany({ where: { type: 'svg' } });
  const bySlug = new Map(groups.map((item) => [item.slug, item.id]));

  await prisma.icon.createMany({
    data: ICON_SEEDS.map((item, index) => ({
      name: item.name,
      slug: item.slug,
      type: 'svg',
      svg: ICONS[item.slug],
      sortOrder: index + 1,
      groupId: bySlug.get(item.group) ?? null,
    })),
  });
}
