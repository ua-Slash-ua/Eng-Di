import type { PrismaClient } from '@prisma/client';

export async function migrateAboutStats(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`about_stat_categories\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`slug\` VARCHAR(120) NOT NULL,
        \`title\` VARCHAR(180) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`about_stat_categories_slug_key\` (\`slug\`)
      ) DEFAULT CHARSET=utf8mb4
    `);
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`about_stats\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`value\` VARCHAR(40) NOT NULL,
        \`label\` VARCHAR(120) NOT NULL,
        \`icon\` VARCHAR(16) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`category_id\` INT UNSIGNED NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`about_stats_category_id_idx\` (\`category_id\`)
      ) DEFAULT CHARSET=utf8mb4
    `);
  try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE \`about_stats\`
          ADD CONSTRAINT \`about_stats_category_id_fkey\`
          FOREIGN KEY (\`category_id\`) REFERENCES \`about_stat_categories\`(\`id\`) ON DELETE RESTRICT
      `);
  } catch {
    /* exists */
  }
}
