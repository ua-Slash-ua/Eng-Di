import type { PrismaClient } from '@prisma/client';

export async function migrateTariffs(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`tariffs\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(120) NOT NULL,
        \`lessons\` INT NOT NULL,
        \`price\` INT NOT NULL,
        \`old_price\` INT NULL,
        \`popular\` TINYINT(1) NOT NULL DEFAULT 0,
        \`note\` VARCHAR(180) NOT NULL,
        \`variant\` VARCHAR(16) NOT NULL DEFAULT 'start',
        \`icon\` VARCHAR(16) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARSET=utf8mb4
    `);
}
