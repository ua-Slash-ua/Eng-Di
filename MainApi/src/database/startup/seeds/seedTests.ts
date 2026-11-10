import {
  ContentEntityType,
  TestAccessDuration,
  TestAnswerKind,
  TestKind,
  type PrismaClient,
} from '@prisma/client';

/**
 * Demo tests: free link-based + material-bound, with choice and write-in answers.
 */
export async function seedTests(prisma: PrismaClient) {
  if ((await prisma.test.count()) > 0) {
    return;
  }

  const lesson =
    (await prisma.contentLesson.findFirst({
      where: { title: 'Nice to meet you' },
      orderBy: { id: 'asc' },
    })) ??
    (await prisma.contentLesson.findFirst({ orderBy: { id: 'asc' } }));

  const unit =
    (await prisma.contentUnit.findFirst({
      where: { title: { contains: 'Hello' } },
      orderBy: { id: 'asc' },
    })) ?? (await prisma.contentUnit.findFirst({ orderBy: { id: 'asc' } }));

  // 1) Free forever — Present Simple (choice + write-in)
  await prisma.test.create({
    data: {
      title: 'Present Simple · Quick Check',
      description: 'Вільний тест: вибір і коротка відповідь. Посилання можна надіслати учню.',
      kind: TestKind.free,
      accessDuration: TestAccessDuration.forever,
      entryPassword: 'SIMPLE1',
      randomize: true,
      sortOrder: 1,
      questions: {
        create: [
          {
            prompt: 'She ___ to school every day.',
            sortOrder: 1,
            options: {
              create: [
                { text: 'go', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 1 },
                { text: 'goes', kind: TestAnswerKind.choice, isCorrect: true, sortOrder: 2 },
                { text: 'going', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 3 },
                { text: 'goes', kind: TestAnswerKind.write_in, isCorrect: true, sortOrder: 4 },
              ],
            },
          },
          {
            prompt: 'They ___ football on Sundays.',
            sortOrder: 2,
            options: {
              create: [
                { text: 'plays', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 1 },
                { text: 'play', kind: TestAnswerKind.choice, isCorrect: true, sortOrder: 2 },
                { text: 'are play', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 3 },
              ],
            },
          },
          {
            prompt: 'Закінчення для he/she/it у Present Simple (одне слово або -s):',
            sortOrder: 3,
            options: {
              create: [
                { text: 's', kind: TestAnswerKind.write_in, isCorrect: true, sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  // 2) Free timed — greetings (15 min window)
  await prisma.test.create({
    data: {
      title: 'Greetings · 15 хвилин',
      description: 'Короткий вільний тест на привітання. Вікно доступу — 15 хвилин після пароля.',
      kind: TestKind.free,
      accessDuration: TestAccessDuration.m15,
      entryPassword: 'HELLO15',
      randomize: false,
      sortOrder: 2,
      questions: {
        create: [
          {
            prompt: 'Як привітатися вранці?',
            sortOrder: 1,
            options: {
              create: [
                { text: 'Good morning', kind: TestAnswerKind.choice, isCorrect: true, sortOrder: 1 },
                { text: 'Good night', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 2 },
                { text: 'See you', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 3 },
              ],
            },
          },
          {
            prompt: '«Nice to meet you» означає…',
            sortOrder: 2,
            options: {
              create: [
                { text: 'Радий познайомитись', kind: TestAnswerKind.choice, isCorrect: true, sortOrder: 1 },
                { text: 'До побачення', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 2 },
                { text: 'Як справи?', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 3 },
              ],
            },
          },
          {
            prompt: 'Напишіть англійською «Дякую»:',
            sortOrder: 3,
            options: {
              create: [
                { text: 'thank you', kind: TestAnswerKind.write_in, isCorrect: true, sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  // 3) Material — linked to lesson if available
  if (lesson) {
    await prisma.test.create({
      data: {
        title: 'Unit check · Nice to meet you',
        description: 'Тест для матеріалу (урок). Перевірка фраз знайомства.',
        kind: TestKind.material,
        entityType: ContentEntityType.lesson,
        entityId: lesson.id,
        accessDuration: TestAccessDuration.h1,
        entryPassword: 'MEET01',
        randomize: true,
        sortOrder: 3,
        questions: {
          create: [
            {
              prompt: 'What do you say when you meet someone for the first time?',
              sortOrder: 1,
              options: {
                create: [
                  { text: 'Nice to meet you', kind: TestAnswerKind.choice, isCorrect: true, sortOrder: 1 },
                  { text: 'Happy birthday', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 2 },
                  { text: 'Good luck', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 3 },
                ],
              },
            },
            {
              prompt: 'Complete: My name ___ Anna.',
              sortOrder: 2,
              options: {
                create: [
                  { text: 'am', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 1 },
                  { text: 'is', kind: TestAnswerKind.choice, isCorrect: true, sortOrder: 2 },
                  { text: 'are', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 3 },
                  { text: 'is', kind: TestAnswerKind.write_in, isCorrect: true, sortOrder: 4 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // 4) Material — linked to unit if available
  if (unit) {
    await prisma.test.create({
      data: {
        title: 'Unit quiz · Introductions',
        description: 'Тест привʼязаний до юніта. 5 хвилин доступу після пароля.',
        kind: TestKind.material,
        entityType: ContentEntityType.unit,
        entityId: unit.id,
        accessDuration: TestAccessDuration.m5,
        entryPassword: 'UNIT5',
        randomize: false,
        sortOrder: 4,
        questions: {
          create: [
            {
              prompt: 'How ___ you?',
              sortOrder: 1,
              options: {
                create: [
                  { text: 'is', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 1 },
                  { text: 'are', kind: TestAnswerKind.choice, isCorrect: true, sortOrder: 2 },
                  { text: 'am', kind: TestAnswerKind.choice, isCorrect: false, sortOrder: 3 },
                ],
              },
            },
            {
              prompt: 'Напишіть англійською «Мене звати…» (фраза):',
              sortOrder: 2,
              options: {
                create: [
                  { text: 'my name is', kind: TestAnswerKind.write_in, isCorrect: true, sortOrder: 1 },
                ],
              },
            },
          ],
        },
      },
    });
  }
}
