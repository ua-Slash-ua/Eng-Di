import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateAccountActivation(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'users', 'activated_at'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`users\`
        ADD COLUMN \`activated_at\` DATETIME(3) NULL AFTER \`admin_role_id\`,
        ADD COLUMN \`pending_password\` VARCHAR(64) NULL AFTER \`activated_at\`
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE \`users\` SET \`activated_at\` = \`created_at\` WHERE \`activated_at\` IS NULL
    `);
  }
}
