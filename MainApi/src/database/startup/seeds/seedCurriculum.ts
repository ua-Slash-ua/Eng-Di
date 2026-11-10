import type { PrismaClient } from '@prisma/client';

/**
 * Seeds one full hierarchical course (Level → Course → Units → Lessons)
 * plus free/orphan items of each type (course without level, unit without course, lesson without unit).
 */
export async function seedCurriculum(prisma: PrismaClient) {
  if ((await prisma.contentLesson.count()) > 0 || (await prisma.contentLevel.count()) > 0) {
    return;
  }

  const a1 = await prisma.contentLevel.create({
    data: {
      code: 'A1',
      title: 'Beginner',
      description: 'Базовий рівень: знайомство, прості фрази, повсякденні теми.',
      sortOrder: 1,
    },
  });

  await prisma.contentLevel.create({
    data: {
      code: 'A2',
      title: 'Elementary',
      description: 'Рівень без привʼязаних курсів — для подальшого наповнення.',
      sortOrder: 2,
    },
  });

  const course = await prisma.contentCourse.create({
    data: {
      levelId: a1.id,
      title: 'English Foundations A1',
      description: 'Повний стартовий курс: 3 юніти з уроками від знайомства до повсякденних тем.',
      sortOrder: 1,
    },
  });

  const unit1 = await prisma.contentUnit.create({
    data: {
      courseId: course.id,
      title: 'Unit 1 · Hello & Introductions',
      description: 'Привітання, імʼя, країна, базові питання.',
      sortOrder: 1,
    },
  });
  const unit2 = await prisma.contentUnit.create({
    data: {
      courseId: course.id,
      title: 'Unit 2 · Daily Life',
      description: 'Розпорядок дня, робота, сімʼя, хобі.',
      sortOrder: 2,
    },
  });
  const unit3 = await prisma.contentUnit.create({
    data: {
      courseId: course.id,
      title: 'Unit 3 · Food & Places',
      description: 'Їжа, кафе, місто, як запитати дорогу.',
      sortOrder: 3,
    },
  });

  const unit1Lessons = [
    { title: 'Nice to meet you', description: 'Привітання та представлення.' },
    { title: 'Where are you from?', description: 'Країни, міста, національності.' },
    { title: 'Numbers & Age', description: 'Числа, вік, телефон.' },
    { title: 'Classroom English', description: 'Фрази для уроку з викладачем.' },
  ];
  const unit2Lessons = [
    { title: 'My Day', description: 'Розпорядок дня та час.' },
    { title: 'Family & Friends', description: 'Сімʼя, друзі, опис людей.' },
    { title: 'Jobs & Work', description: 'Професії та місце роботи.' },
    { title: 'Hobbies', description: 'Хобі та вільний час.' },
  ];
  const unit3Lessons = [
    { title: 'Food & Drinks', description: 'Їжа, напої, уподобання.' },
    { title: 'At the Café', description: 'Замовлення в кафе.' },
    { title: 'In the City', description: 'Місця в місті.' },
    { title: 'Asking the Way', description: 'Як запитати і пояснити дорогу.' },
  ];

  async function createUnitLessons(
    unitId: number,
    rows: { title: string; description: string }[],
  ) {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      await prisma.contentLesson.create({
        data: {
          unitId,
          title: row.title,
          description: row.description,
          content: {
            goals: [row.description],
            notes: 'Демонстраційний контент для тестування бібліотеки.',
          },
          sortOrder: i + 1,
        },
      });
    }
  }

  await createUnitLessons(unit1.id, unit1Lessons);
  await createUnitLessons(unit2.id, unit2Lessons);
  await createUnitLessons(unit3.id, unit3Lessons);

  // Free course (no level)
  await prisma.contentCourse.create({
    data: {
      levelId: null,
      title: 'Speaking Club Intensive',
      description: 'Вільний курс без рівня — розмовна практика для будь-якого студента.',
      sortOrder: 100,
    },
  });

  // Free unit (no course)
  const freeUnit = await prisma.contentUnit.create({
    data: {
      courseId: null,
      title: 'Travel Phrases Pack',
      description: 'Вільний юніт без курсу — фрази для подорожей.',
      sortOrder: 100,
    },
  });
  await prisma.contentLesson.create({
    data: {
      unitId: freeUnit.id,
      title: 'At the Airport',
      description: 'Реєстрація, безпека, gate.',
      content: { goals: ['Airport check-in phrases'] },
      sortOrder: 1,
    },
  });
  await prisma.contentLesson.create({
    data: {
      unitId: freeUnit.id,
      title: 'Hotel Check-in',
      description: 'Заселення в готель.',
      content: { goals: ['Hotel reception dialogue'] },
      sortOrder: 2,
    },
  });

  // Free lessons (no unit)
  await prisma.contentLesson.createMany({
    data: [
      {
        unitId: null,
        title: 'Business Email Basics',
        description: 'Вільний урок без юніта — структура ділового листа.',
        content: { goals: ['Write a short business email'] },
        sortOrder: 200,
      },
      {
        unitId: null,
        title: 'Job Interview Warm-up',
        description: 'Вільний урок — типові питання на співбесіді.',
        content: { goals: ['Answer 5 common interview questions'] },
        sortOrder: 201,
      },
      {
        unitId: null,
        title: 'Small Talk Starters',
        description: 'Вільний урок — як почати невимушену розмову.',
        content: { goals: ['Start and keep small talk'] },
        sortOrder: 202,
      },
    ],
  });
}
