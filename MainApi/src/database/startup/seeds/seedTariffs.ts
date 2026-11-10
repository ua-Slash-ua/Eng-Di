import type { PrismaClient } from '@prisma/client';
import { ICONS } from '../iconSvgs';

export async function seedTariffs(prisma: PrismaClient) {
  if ((await prisma.tariff.count()) > 0) {
    return;
  }
  await prisma.tariff.createMany({
    data: [
      {
        title: '4 уроки',
        lessons: 4,
        price: 1920,
        oldPrice: null,
        popular: false,
        note: '✨ Чудовий старт',
        variant: 'start',
        icon: ICONS.book,
        sortOrder: 1,
      },
      {
        title: '8 уроків',
        lessons: 8,
        price: 3648,
        oldPrice: 3840,
        popular: true,
        note: '💗 Більше практики — кращий результат',
        variant: 'mid',
        icon: ICONS.book,
        sortOrder: 2,
      },
      {
        title: '12 уроків',
        lessons: 12,
        price: 5184,
        oldPrice: 5760,
        popular: false,
        note: '⭐ Найкраща ціна — найбільший прогрес',
        variant: 'pro',
        icon: ICONS.book,
        sortOrder: 3,
      },
    ],
  });
}
