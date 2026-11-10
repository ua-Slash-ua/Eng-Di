import type { PrismaClient } from '@prisma/client';

export async function seedRules(prisma: PrismaClient) {
  if ((await prisma.schoolRule.count()) > 0) {
    return;
  }
  await prisma.schoolRule.createMany({
    data: [
      {
        title: 'Оплата наперед за обраний пакет',
        description: '4 / 8 / 12 занять на місяць, оплата з 1 по 5 число включно.',
        accent: 1,
        sortOrder: 1,
      },
      {
        title: 'Один платіж за весь пакет',
        description: 'Не поурочно — так простіше планувати заняття наперед.',
        accent: 2,
        sortOrder: 2,
      },
      {
        title: 'Попереджай про відсутність заздалегідь',
        description: 'Тоді заняття можна перенести протягом місяця в зручний час.',
        accent: 3,
        sortOrder: 3,
      },
      {
        title: 'Пропуск без попередження',
        description: 'На жаль, таке заняття згорає — це чесно і для школи, і для тебе.',
        accent: 4,
        sortOrder: 4,
      },
      {
        title: 'Хвороба чи форс-мажор',
        description: 'За домовленістю заняття заморожується або переноситься без втрат.',
        accent: 5,
        sortOrder: 5,
      },
    ],
  });
}
