import { BlockType, Prisma, type PrismaClient } from '@prisma/client';
import { BLOCK_DEFAULTS } from '../../../blocks/block-defaults';

export async function seedHomePage(prisma: PrismaClient) {
  const existing = await prisma.page.findUnique({ where: { slug: '/' } });
  if (existing) {
    await prisma.pageSeo.upsert({
      where: { pageId: existing.id },
      create: {
        pageId: existing.id,
        title: existing.title,
      },
      update: {},
    });
    return;
  }

  const types: BlockType[] = ['HERO', 'ABOUT', 'TARIFFS', 'RULES', 'FORM'];
  try {
    await prisma.page.create({
      data: {
        slug: '/',
        title: 'Головна',
        seo: {
          create: {
            title: 'EngDi — школа англійської',
            description: 'Школа англійської мови. Курси, тарифи і заявка на навчання.',
            keywords: 'англійська, школа, курси, EngDi',
          },
        },
        blocks: {
          create: types.map((type, index) => ({
            type,
            sortOrder: index + 1,
            content: BLOCK_DEFAULTS[type] as Prisma.InputJsonValue,
          })),
        },
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code !== 'P2002') {
      throw error;
    }
  }
}
