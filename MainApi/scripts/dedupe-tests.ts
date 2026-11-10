import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const all = await prisma.test.findMany({ orderBy: { id: 'asc' } });
    const seen = new Set<string>();
    const drop: number[] = [];
    for (const t of all) {
      if (seen.has(t.title)) drop.push(t.id);
      else seen.add(t.title);
    }
    if (drop.length) {
      await prisma.test.deleteMany({ where: { id: { in: drop } } });
      console.log('deleted', drop);
    }
    const left = await prisma.test.findMany({
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
    console.log(JSON.stringify(left, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
