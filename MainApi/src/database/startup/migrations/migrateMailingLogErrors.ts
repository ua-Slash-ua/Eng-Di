import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateMailingLogErrors(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'mailing_logs', 'error_raw'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`mailing_logs\`
        ADD COLUMN \`error_raw\` TEXT NULL AFTER \`error\`
    `);
  }
}
