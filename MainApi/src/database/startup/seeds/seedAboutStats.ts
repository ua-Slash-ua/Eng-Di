import type { PrismaClient } from '@prisma/client';
import { ICONS } from '../iconSvgs';

export async function seedAboutStats(prisma: PrismaClient) {
  const hero = await prisma.aboutStatCategory.upsert({
    where: { slug: 'hero' },
    create: { slug: 'hero', title: 'Герой' },
    update: { title: 'Герой' },
  });
  const about = await prisma.aboutStatCategory.upsert({
    where: { slug: 'about' },
    create: { slug: 'about', title: 'Про школу' },
    update: { title: 'Про школу' },
  });

  if ((await prisma.aboutStat.count()) > 0) {
    return;
  }

  await prisma.aboutStat.createMany({
    data: [
      { value: '7 років', label: 'досвіду викладання', icon: ICONS.cap, sortOrder: 1, categoryId: hero.id },
      { value: '120+', label: 'учнів заговорили', icon: ICONS.smile, sortOrder: 2, categoryId: hero.id },
      { value: '4.9/5', label: 'середня оцінка', icon: ICONS.star, sortOrder: 3, categoryId: hero.id },
      { value: '500+', label: 'проведених занять', icon: null, sortOrder: 1, categoryId: about.id },
      { value: 'CELTA', label: 'міжнародний сертифікат', icon: null, sortOrder: 2, categoryId: about.id },
      { value: 'A1–C2', label: 'усі рівні', icon: null, sortOrder: 3, categoryId: about.id },
    ],
  });
}
