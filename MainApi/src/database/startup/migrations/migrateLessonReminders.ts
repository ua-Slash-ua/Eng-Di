import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

async function indexExists(prisma: PrismaClient, table: string, index: string) {
  const rows = await prisma.$queryRaw<Array<{ c: bigint | number }>>`
    SELECT COUNT(*) AS c
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${table}
      AND INDEX_NAME = ${index}
  `;
  return Number(rows[0]?.c ?? 0) > 0;
}

export async function migrateLessonReminders(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'lessons', 'reminder_sent_at'))) {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`lessons\`
          ADD COLUMN \`reminder_sent_at\` DATETIME(3) NULL AFTER \`refunded_at\`
      `);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Duplicate column') && !message.includes('1060')) {
        throw error;
      }
    }
  }
  if (!(await indexExists(prisma, 'lessons', 'lessons_status_starts_at_idx'))) {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`lessons\`
          ADD KEY \`lessons_status_starts_at_idx\` (\`status\`, \`starts_at\`)
      `);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Duplicate key') && !message.includes('1061')) {
        throw error;
      }
    }
  }
}
