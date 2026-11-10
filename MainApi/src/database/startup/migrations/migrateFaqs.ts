import type { PrismaClient } from '@prisma/client';

export async function migrateFaqs(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`faqs\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`question\` VARCHAR(220) NOT NULL,
        \`answer\` VARCHAR(600) NOT NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARSET=utf8mb4
    `);
}
