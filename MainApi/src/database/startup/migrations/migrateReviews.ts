import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateReviews(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`reviews\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`quote\` VARCHAR(400) NOT NULL,
        \`author\` VARCHAR(80) NOT NULL,
        \`result\` VARCHAR(80) NOT NULL,
        \`rating\` INT NOT NULL DEFAULT 5,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARSET=utf8mb4
    `);

  if (!(await columnExists(prisma, 'reviews', 'kind'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`reviews\`
        ADD COLUMN \`kind\` ENUM('manual', 'user') NOT NULL DEFAULT 'manual' AFTER \`rating\`,
        ADD COLUMN \`target\` ENUM('school', 'teacher') NOT NULL DEFAULT 'school' AFTER \`kind\`,
        ADD COLUMN \`user_id\` INT UNSIGNED NULL AFTER \`target\`,
        ADD COLUMN \`teacher_id\` INT UNSIGNED NULL AFTER \`user_id\`,
        ADD COLUMN \`is_verified\` BOOLEAN NOT NULL DEFAULT false AFTER \`teacher_id\`,
        ADD INDEX \`reviews_kind_idx\` (\`kind\`),
        ADD INDEX \`reviews_is_verified_idx\` (\`is_verified\`),
        ADD INDEX \`reviews_user_id_idx\` (\`user_id\`)
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE \`reviews\` SET \`kind\` = 'manual', \`is_verified\` = true WHERE \`user_id\` IS NULL
    `);
  }
}
