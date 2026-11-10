import type { PrismaClient } from '@prisma/client';

export async function seedLeadCategories(prisma: PrismaClient) {
  const site = await prisma.leadCategory.upsert({
    where: { slug: 'site' },
    create: { slug: 'site', title: 'Заявка з сайту' },
    update: { title: 'Заявка з сайту' },
  });
  await prisma.lead.updateMany({ where: { categoryId: null }, data: { categoryId: site.id } });
  await prisma.lead.updateMany({ where: { location: null }, data: { location: '/' } });
}
