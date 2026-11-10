import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateTariffSubscriptions(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'tariffs', 'lesson_price'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`tariffs\`
        ADD COLUMN \`lesson_price\` INT NOT NULL DEFAULT 0 AFTER \`icon\`,
        ADD COLUMN \`payment_mode\` ENUM('once', 'installments') NOT NULL DEFAULT 'once' AFTER \`lesson_price\`,
        ADD COLUMN \`duration_months\` INT NOT NULL DEFAULT 1 AFTER \`payment_mode\`
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE \`tariffs\`
      SET \`lesson_price\` = ROUND(\`price\` / \`lessons\`)
      WHERE \`lessons\` > 0 AND \`lesson_price\` = 0
    `);
  }

  if (!(await columnExists(prisma, 'tariffs', 'installment_count'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`tariffs\`
        ADD COLUMN \`installment_count\` INT NOT NULL DEFAULT 1 AFTER \`payment_mode\`
    `);
  } else {
    await prisma.$executeRawUnsafe(`
      UPDATE \`tariffs\`
      SET \`installment_count\` = CASE
        WHEN \`installment_count\` >= 1 THEN \`installment_count\`
        WHEN \`payment_mode\` = 'installments' THEN 2
        ELSE 1
      END
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`tariffs\`
        MODIFY COLUMN \`installment_count\` INT NOT NULL DEFAULT 1
    `);
  }
  await prisma.$executeRawUnsafe(`
    UPDATE \`tariffs\`
    SET \`payment_mode\` = IF(\`installment_count\` <= 1, 'once', 'installments')
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`user_tariffs\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`user_id\` INT UNSIGNED NOT NULL,
      \`tariff_id\` INT UNSIGNED NOT NULL,
      \`status\` ENUM('active', 'scheduled', 'expired', 'cancelled') NOT NULL,
      \`starts_at\` DATETIME(3) NOT NULL,
      \`ends_at\` DATETIME(3) NOT NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      KEY \`user_tariffs_user_id_status_idx\` (\`user_id\`, \`status\`),
      KEY \`user_tariffs_ends_at_idx\` (\`ends_at\`),
      CONSTRAINT \`user_tariffs_user_id_fkey\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`user_tariffs_tariff_id_fkey\`
        FOREIGN KEY (\`tariff_id\`) REFERENCES \`tariffs\`(\`id\`) ON DELETE RESTRICT
    ) DEFAULT CHARSET=utf8mb4
  `);
}
