import type { PrismaClient } from '@prisma/client';

export async function migratePasswordReset(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`password_reset_tokens\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`user_id\` INT UNSIGNED NOT NULL,
      \`token_hash\` VARCHAR(64) NOT NULL,
      \`expires_at\` DATETIME(3) NOT NULL,
      \`used_at\` DATETIME(3) NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE KEY \`password_reset_tokens_token_hash_key\` (\`token_hash\`),
      KEY \`password_reset_tokens_user_id_expires_at_idx\` (\`user_id\`, \`expires_at\`),
      KEY \`password_reset_tokens_expires_at_used_at_idx\` (\`expires_at\`, \`used_at\`),
      CONSTRAINT \`password_reset_tokens_user_id_fkey\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
        ON DELETE CASCADE ON UPDATE CASCADE,
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}
