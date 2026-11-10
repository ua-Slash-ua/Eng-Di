import type { PrismaClient } from '@prisma/client';

export async function migratePageSections(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`page_sections\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`page_id\` INT UNSIGNED NOT NULL,
        \`block_id\` INT UNSIGNED NOT NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`page_sections_page_id_block_id_key\` (\`page_id\`, \`block_id\`),
        KEY \`page_sections_page_id_idx\` (\`page_id\`),
        KEY \`page_sections_block_id_idx\` (\`block_id\`)
      ) DEFAULT CHARSET=utf8mb4
    `);
  try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE \`page_sections\`
          ADD CONSTRAINT \`page_sections_page_id_fkey\`
          FOREIGN KEY (\`page_id\`) REFERENCES \`pages\`(\`id\`) ON DELETE CASCADE
      `);
  } catch {
    /* exists */
  }
  try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE \`page_sections\`
          ADD CONSTRAINT \`page_sections_block_id_fkey\`
          FOREIGN KEY (\`block_id\`) REFERENCES \`blocks\`(\`id\`) ON DELETE CASCADE
      `);
  } catch {
    /* exists */
  }
}
