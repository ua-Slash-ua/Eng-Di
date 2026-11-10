import type { PrismaClient } from '@prisma/client';

export async function seedFaqs(prisma: PrismaClient) {
  if ((await prisma.faq.count()) > 0) {
    return;
  }
  await prisma.faq.createMany({
    data: [
      {
        question: 'Як проходить пробне заняття?',
        answer: 'Онлайн, 30 хвилин: знайомимось, визначаємо рівень і підбираємо формат. Це безплатно.',
        sortOrder: 1,
      },
      {
        question: 'Скільки триває звичайний урок?',
        answer: '60 хвилин один на один з викладачем. Час підбираємо під твій графік.',
        sortOrder: 2,
      },
      {
        question: 'Що як я пропущу заняття?',
        answer: 'Попередь заздалегідь — і перенесемо урок на зручний час протягом місяця.',
        sortOrder: 3,
      },
      {
        question: 'Які матеріали потрібні для навчання?',
        answer: 'Нічого купувати не треба: всі матеріали надаємо в електронному вигляді.',
        sortOrder: 4,
      },
    ],
  });
}
