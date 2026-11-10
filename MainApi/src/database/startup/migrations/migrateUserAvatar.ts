import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateUserAvatar(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'users', 'avatar_url'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`users\`
        ADD COLUMN \`avatar_url\` VARCHAR(500) NULL AFTER \`phone\`
    `);
  }
}
