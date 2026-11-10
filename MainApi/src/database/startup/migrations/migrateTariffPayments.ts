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

export async function migrateTariffPayments(prisma: PrismaClient) {
  if (await tableExists(prisma, 'user_tariff_payments')) {
    return;
  }
  await prisma.$executeRawUnsafe(`
    CREATE TABLE \`user_tariff_payments\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`user_tariff_id\` INT UNSIGNED NOT NULL,
      \`part_number\` INT NOT NULL,
      \`lessons\` INT NOT NULL,
      \`amount\` INT NOT NULL,
      \`paid_at\` DATETIME(3) NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`user_tariff_payments_user_tariff_id_part_number_key\` (\`user_tariff_id\`, \`part_number\`),
      CONSTRAINT \`user_tariff_payments_user_tariff_id_fkey\`
        FOREIGN KEY (\`user_tariff_id\`) REFERENCES \`user_tariffs\`(\`id\`) ON DELETE CASCADE
    ) DEFAULT CHARSET=utf8mb4
  `);
}
