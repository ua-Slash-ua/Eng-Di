import type { PrismaClient } from '@prisma/client';

export async function migrateLessonOutcomes(prisma: PrismaClient) {
  const columns = await prisma.$queryRaw<Array<{ COLUMN_TYPE: string }>>`
    SELECT COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'lessons'
      AND COLUMN_NAME = 'status'
  `;
  if (!columns[0] || columns[0].COLUMN_TYPE.includes('missed')) return;

  await prisma.$executeRawUnsafe(`
    ALTER TABLE \`lessons\`
      MODIFY COLUMN \`status\` ENUM(
        'unscheduled',
        'proposed',
        'confirmed',
        'done',
        'missed',
        'admin_skip',
        'frozen',
        'cancelled'
      ) NOT NULL DEFAULT 'unscheduled'
  `);
}
