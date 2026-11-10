import type { PrismaClient } from '@prisma/client';

const HOME_SECTION_ORDER = [
  'hero',
  'about',
  'levels',
  'formats',
  'pricing',
  'rules',
  'reviews',
  'cta',
  'lead',
] as const;

/** Attach existing library blocks to the home page in a sensible default order. */
export async function seedHomePageSections(prisma: PrismaClient) {
  const home = await prisma.page.findUnique({ where: { slug: '/' } });
  if (!home) return;

  const existingCount = await prisma.pageSection.count({ where: { pageId: home.id } });
  if (existingCount > 0) return;

  let sortOrder = 0;
  for (const type of HOME_SECTION_ORDER) {
    const block = await prisma.block.findFirst({
      where: { type },
      orderBy: { id: 'asc' },
    });
    if (!block) continue;
    sortOrder += 1;
    await prisma.pageSection.create({
      data: {
        pageId: home.id,
        blockId: block.id,
        sortOrder,
      },
    });
  }
}
