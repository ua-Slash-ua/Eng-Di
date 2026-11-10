import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateIcons(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`icon_groups\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`slug\` VARCHAR(120) NOT NULL,
        \`title\` VARCHAR(180) NOT NULL,
        \`type\` VARCHAR(16) NOT NULL DEFAULT 'svg',
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`icon_groups_type_slug_key\` (\`type\`, \`slug\`),
        KEY \`icon_groups_type_idx\` (\`type\`)
      ) DEFAULT CHARSET=utf8mb4
    `);

  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`icons\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(120) NOT NULL,
        \`slug\` VARCHAR(120) NOT NULL,
        \`type\` VARCHAR(16) NOT NULL DEFAULT 'svg',
        \`svg\` TEXT NULL,
        \`url\` VARCHAR(500) NULL,
        \`alt\` VARCHAR(255) NULL,
        \`mime\` VARCHAR(80) NULL,
        \`size_bytes\` INT NULL,
        \`original_name\` VARCHAR(255) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`group_id\` INT UNSIGNED NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`icons_slug_key\` (\`slug\`),
        KEY \`icons_group_id_idx\` (\`group_id\`),
        KEY \`icons_type_idx\` (\`type\`)
      ) DEFAULT CHARSET=utf8mb4
    `);

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`icons\` MODIFY \`svg\` TEXT NULL`);
  } catch {
    /* ok */
  }

  const iconColumns: Array<{ name: string; sql: string }> = [
    { name: 'url', sql: 'ADD COLUMN `url` VARCHAR(500) NULL' },
    { name: 'alt', sql: 'ADD COLUMN `alt` VARCHAR(255) NULL' },
    { name: 'mime', sql: 'ADD COLUMN `mime` VARCHAR(80) NULL' },
    { name: 'size_bytes', sql: 'ADD COLUMN `size_bytes` INT NULL' },
    { name: 'original_name', sql: 'ADD COLUMN `original_name` VARCHAR(255) NULL' },
  ];
  for (const column of iconColumns) {
    if (await columnExists(prisma, 'icons', column.name)) {
      continue;
    }
    await prisma.$executeRawUnsafe(`ALTER TABLE \`icons\` ${column.sql}`);
  }

  if (!(await columnExists(prisma, 'icon_groups', 'type'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`icon_groups\` ADD COLUMN \`type\` VARCHAR(16) NOT NULL DEFAULT 'svg'`,
    );
  }

  // Move uniqueness from slug-alone to (type, slug).
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`icon_groups\` DROP INDEX \`icon_groups_slug_key\``);
  } catch {
    /* missing or already dropped */
  }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`icon_groups\` ADD UNIQUE KEY \`icon_groups_type_slug_key\` (\`type\`, \`slug\`)`,
    );
  } catch {
    /* exists */
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`icon_groups\` ADD KEY \`icon_groups_type_idx\` (\`type\`)`);
  } catch {
    /* exists */
  }

  try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE \`icons\`
          ADD CONSTRAINT \`icons_group_id_fkey\`
          FOREIGN KEY (\`group_id\`) REFERENCES \`icon_groups\`(\`id\`) ON DELETE SET NULL
      `);
  } catch {
    /* exists */
  }
}
