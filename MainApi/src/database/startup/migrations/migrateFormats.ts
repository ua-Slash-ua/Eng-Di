import type { PrismaClient } from '@prisma/client';

export async function migrateFormats(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`formats\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(120) NOT NULL,
        \`description\` VARCHAR(320) NOT NULL,
        \`icon\` VARCHAR(16) NULL,
        \`accent\` INT NOT NULL DEFAULT 1,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARSET=utf8mb4
    `);
}
