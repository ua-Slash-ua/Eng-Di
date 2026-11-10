import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ override: true });
const url = process.env.DATABASE_URL_PROD?.trim();
const prisma = new PrismaClient({ datasources: { db: { url } } });

try {
  const checks = {
    pages: await prisma.page.count(),
    users: await prisma.user.count(),
    lessons: await prisma.lesson.count(),
    tests: await prisma.test.count(),
    content_lessons: await prisma.contentLesson.count(),
    leads: await prisma.lead.count(),
  };
  console.log('PROD counts:', checks);
  const users = await prisma.user.findMany({ select: { id: true, email: true }, orderBy: { id: 'asc' } });
  console.log('PROD users:', users);
} finally {
  await prisma.$disconnect();
}
