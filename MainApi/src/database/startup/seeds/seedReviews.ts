import type { PrismaClient } from '@prisma/client';

export async function seedReviews(prisma: PrismaClient) {
  if ((await prisma.review.count()) > 0) {
    return;
  }
  await prisma.review.createMany({
    data: [
      {
        quote: 'За півроку перейшла з A2 на B2 — і це відчутно на співбесідах.',
        author: 'Марія Т.',
        result: 'A2 → B2 за 6 місяців',
        rating: 5,
        sortOrder: 1,
      },
      {
        quote: 'Пояснюють настільки просто, що граматика нарешті «клацнула».',
        author: 'Андрій С.',
        result: 'B1 → B2',
        rating: 5,
        sortOrder: 2,
      },
      {
        quote: 'Здала IELTS на 7.5 після трьох місяців занять за чітким планом.',
        author: 'Юлія В.',
        result: 'B2 → C1',
        rating: 5,
        sortOrder: 3,
      },
    ],
  });
}
