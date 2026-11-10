import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateLessonReschedule(prisma: PrismaClient) {
  const columns = await prisma.$queryRaw<Array<{ COLUMN_TYPE: string }>>`
    SELECT COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'lessons'
      AND COLUMN_NAME = 'status'
  `;
  if (columns[0] && !columns[0].COLUMN_TYPE.includes('rescheduling')) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`lessons\`
        MODIFY COLUMN \`status\` ENUM(
          'unscheduled',
          'proposed',
          'confirmed',
          'rescheduling',
          'done',
          'missed',
          'admin_skip',
          'frozen',
          'cancelled'
        ) NOT NULL DEFAULT 'unscheduled'
    `);
  }

  if (!(await columnExists(prisma, 'lessons', 'prior_starts_at'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`lessons\`
        ADD COLUMN \`prior_starts_at\` DATETIME(3) NULL AFTER \`ends_at\`,
        ADD COLUMN \`prior_ends_at\` DATETIME(3) NULL AFTER \`prior_starts_at\`
    `);
  }
}
