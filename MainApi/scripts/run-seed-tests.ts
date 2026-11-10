import { PrismaClient } from '@prisma/client';
import { seedTests } from '../src/database/startup/seeds/seedTests';

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedTests(prisma);
    const rows = await prisma.test.findMany({
      select: {
        id: true,
        title: true,
        kind: true,
        entryPassword: true,
        accessDuration: true,
        _count: { select: { questions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
