import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateUserProfileFields(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'users', 'first_name'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`users\`
        ADD COLUMN \`first_name\` VARCHAR(80) NULL AFTER \`name\`,
        ADD COLUMN \`last_name\` VARCHAR(80) NULL AFTER \`first_name\`,
        ADD COLUMN \`middle_name\` VARCHAR(80) NULL AFTER \`last_name\`,
        ADD COLUMN \`birth_date\` DATE NULL AFTER \`middle_name\`
    `);
  }
}
