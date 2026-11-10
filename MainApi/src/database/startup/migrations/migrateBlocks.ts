import type { PrismaClient } from '@prisma/client';

export async function migrateBlocks(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`blocks\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`type\` VARCHAR(40) NOT NULL,
        \`name\` VARCHAR(180) NOT NULL,
        \`plaque\` VARCHAR(80) NULL,
        \`title\` TEXT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`blocks_type_idx\` (\`type\`)
      ) DEFAULT CHARSET=utf8mb4
    `);
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`blocks_meta\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`block_id\` INT UNSIGNED NOT NULL,
        \`key\` VARCHAR(80) NOT NULL,
        \`value\` TEXT NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`blocks_meta_block_id_key_key\` (\`block_id\`, \`key\`),
        KEY \`blocks_meta_block_id_idx\` (\`block_id\`)
      ) DEFAULT CHARSET=utf8mb4
    `);
  try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE \`blocks_meta\`
          ADD CONSTRAINT \`blocks_meta_block_id_fkey\`
          FOREIGN KEY (\`block_id\`) REFERENCES \`blocks\`(\`id\`) ON DELETE CASCADE
      `);
  } catch {
    /* exists */
  }
}
