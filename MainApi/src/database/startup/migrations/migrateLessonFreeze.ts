import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateLessonFreeze(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'tariffs', 'frozen_lessons_per_month'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`tariffs\`
        ADD COLUMN \`frozen_lessons_per_month\` INT NOT NULL DEFAULT 0 AFTER \`duration_months\`
    `);
  }

  if (!(await columnExists(prisma, 'lessons', 'frozen_at'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`lessons\`
        ADD COLUMN \`frozen_at\` DATETIME(3) NULL AFTER \`ends_at\`,
        ADD COLUMN \`refunded_at\` DATETIME(3) NULL AFTER \`frozen_at\`
    `);
  }

  const columns = await prisma.$queryRaw<Array<{ COLUMN_TYPE: string }>>`
    SELECT COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'lessons'
      AND COLUMN_NAME = 'status'
  `;
  if (columns[0] && !columns[0].COLUMN_TYPE.includes('frozen')) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`lessons\`
        MODIFY COLUMN \`status\` ENUM('unscheduled', 'proposed', 'confirmed', 'done', 'frozen', 'cancelled') NOT NULL DEFAULT 'unscheduled'
    `);
  }
}
