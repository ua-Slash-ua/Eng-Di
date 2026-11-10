import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateLeadMeta(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`lead_categories\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`slug\` VARCHAR(120) NOT NULL,
        \`title\` VARCHAR(180) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`lead_categories_slug_key\` (\`slug\`)
      ) DEFAULT CHARSET=utf8mb4
    `);

  if (!(await columnExists(prisma, 'leads', 'location'))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`leads\` ADD COLUMN \`location\` VARCHAR(180) NULL`);
  }
  if (!(await columnExists(prisma, 'leads', 'category_id'))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`leads\` ADD COLUMN \`category_id\` INT UNSIGNED NULL`);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`leads\` ADD INDEX \`leads_category_id_idx\` (\`category_id\`)`);
  } catch {
    /* exists */
  }
  try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE \`leads\`
          ADD CONSTRAINT \`leads_category_id_fkey\`
          FOREIGN KEY (\`category_id\`) REFERENCES \`lead_categories\`(\`id\`) ON DELETE SET NULL
      `);
  } catch {
    /* exists */
  }
}
