import type { PrismaClient } from '@prisma/client';

export async function migratePageSeo(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`page_seo\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`page_id\` INT UNSIGNED NOT NULL,
        \`title\` VARCHAR(180) NULL,
        \`description\` VARCHAR(320) NULL,
        \`keywords\` VARCHAR(320) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`page_seo_page_id_key\` (\`page_id\`)
      ) DEFAULT CHARSET=utf8mb4
    `);

  const columns = await prisma.$queryRaw<Array<{ c: bigint | number }>>`
      SELECT COUNT(*) AS c
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pages'
        AND COLUMN_NAME = 'seo_title'
    `;
  const hasOldSeo = Number(columns[0]?.c ?? 0) > 0;
  if (hasOldSeo) {
    await prisma.$executeRawUnsafe(`
        INSERT IGNORE INTO page_seo (page_id, title, description, keywords)
        SELECT id, seo_title, seo_description, seo_keywords FROM pages
      `);
    await prisma.$executeRawUnsafe(`
        ALTER TABLE pages
          DROP COLUMN seo_title,
          DROP COLUMN seo_description,
          DROP COLUMN seo_keywords
      `);
  }

  await prisma.$executeRawUnsafe(`UPDATE pages SET slug = '/' WHERE slug = 'home'`);

  try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE page_seo
          ADD CONSTRAINT page_seo_page_id_fkey
          FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
      `);
  } catch {
    /* already exists */
  }
}
