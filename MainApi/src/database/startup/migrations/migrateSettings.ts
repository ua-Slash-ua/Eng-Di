import type { PrismaClient } from '@prisma/client';

export async function migrateSettings(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`settings\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`key\` VARCHAR(80) NOT NULL,
        \`value\` JSON NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`settings_key_key\` (\`key\`)
      ) DEFAULT CHARSET=utf8mb4
    `);
}
