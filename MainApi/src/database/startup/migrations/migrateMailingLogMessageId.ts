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

export async function migrateMailingLogMessageId(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'mailing_logs', 'message_id'))) {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`mailing_logs\`
          ADD COLUMN \`message_id\` VARCHAR(255) NULL AFTER \`error_raw\`
      `);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Duplicate column') && !message.includes('1060')) {
        throw error;
      }
    }
  }
  if (!(await indexExists(prisma, 'mailing_logs', 'mailing_logs_message_id_idx'))) {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`mailing_logs\`
          ADD KEY \`mailing_logs_message_id_idx\` (\`message_id\`)
      `);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Duplicate key') && !message.includes('1061')) {
        throw error;
      }
    }
  }
}
