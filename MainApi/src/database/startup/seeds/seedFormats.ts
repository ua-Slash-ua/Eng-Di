import type { PrismaClient } from '@prisma/client';
import { ICONS } from '../iconSvgs';

export async function seedFormats(prisma: PrismaClient) {
  if ((await prisma.format.count()) > 0) {
    return;
  }
  await prisma.format.createMany({
    data: [
      {
        title: 'Розмовна практика',
        description: 'Знімаємо страх говорити: живі теми, імпровізація, виправлення помилок одразу.',
        icon: ICONS.chat,
        accent: 1,
        sortOrder: 1,
      },
      {
        title: 'Граматика й база',
        description: 'Системно закриваємо прогалини — від часів дієслова до складних конструкцій.',
        icon: ICONS.layers,
        accent: 2,
        sortOrder: 2,
      },
      {
        title: 'Підготовка до іспитів',
        description: 'IELTS, Cambridge, співбесіда на роботу — з конкретним дедлайном і планом.',
        icon: ICONS.target,
        accent: 3,
        sortOrder: 3,
      },
    ],
  });
}
