import type { PrismaClient } from '@prisma/client';

async function tableExists(prisma: PrismaClient, table: string) {
  const rows = await prisma.$queryRaw<Array<{ c: bigint | number }>>`
      SELECT COUNT(*) AS c
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ${table}
    `;
  return Number(rows[0]?.c ?? 0) > 0;
}

export async function migrateMailingLogs(prisma: PrismaClient) {
  if (await tableExists(prisma, 'mailing_logs')) {
    return;
  }
  await prisma.$executeRawUnsafe(`
    CREATE TABLE \`mailing_logs\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`type\` VARCHAR(40) NOT NULL,
      \`email\` VARCHAR(191) NOT NULL,
      \`user_id\` INT UNSIGNED NULL,
      \`reason\` VARCHAR(255) NOT NULL,
      \`status\` VARCHAR(20) NOT NULL,
      \`error\` VARCHAR(500) NULL,
      \`error_raw\` TEXT NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      KEY \`mailing_logs_type_idx\` (\`type\`),
      KEY \`mailing_logs_email_idx\` (\`email\`),
      KEY \`mailing_logs_user_id_idx\` (\`user_id\`),
      KEY \`mailing_logs_created_at_idx\` (\`created_at\`),
      CONSTRAINT \`mailing_logs_user_id_fkey\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}
