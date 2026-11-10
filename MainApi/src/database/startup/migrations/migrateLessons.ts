import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

async function tableExists(prisma: PrismaClient, table: string) {
  const rows = await prisma.$queryRaw<Array<{ c: bigint | number }>>`
      SELECT COUNT(*) AS c
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ${table}
    `;
  return Number(rows[0]?.c ?? 0) > 0;
}

export async function migrateLessons(prisma: PrismaClient) {
  if (!(await tableExists(prisma, 'lessons'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`lessons\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`student_id\` INT UNSIGNED NOT NULL,
        \`teacher_id\` INT UNSIGNED NULL,
        \`user_tariff_id\` INT UNSIGNED NOT NULL,
        \`payment_id\` INT UNSIGNED NOT NULL,
        \`number\` INT NOT NULL,
        \`status\` ENUM('unscheduled', 'proposed', 'confirmed', 'rescheduling', 'done', 'missed', 'admin_skip', 'frozen', 'cancelled') NOT NULL DEFAULT 'unscheduled',
        \`proposed_by\` ENUM('teacher', 'student') NULL,
        \`starts_at\` DATETIME(3) NULL,
        \`ends_at\` DATETIME(3) NULL,
        \`prior_starts_at\` DATETIME(3) NULL,
        \`prior_ends_at\` DATETIME(3) NULL,
        \`frozen_at\` DATETIME(3) NULL,
        \`refunded_at\` DATETIME(3) NULL,
        \`reminder_sent_at\` DATETIME(3) NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`lessons_user_tariff_id_number_key\` (\`user_tariff_id\`, \`number\`),
        KEY \`lessons_student_id_status_idx\` (\`student_id\`, \`status\`),
        KEY \`lessons_teacher_id_status_idx\` (\`teacher_id\`, \`status\`),
        KEY \`lessons_status_starts_at_idx\` (\`status\`, \`starts_at\`),
        CONSTRAINT \`lessons_student_id_fkey\`
          FOREIGN KEY (\`student_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`lessons_teacher_id_fkey\`
          FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`lessons_user_tariff_id_fkey\`
          FOREIGN KEY (\`user_tariff_id\`) REFERENCES \`user_tariffs\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`lessons_payment_id_fkey\`
          FOREIGN KEY (\`payment_id\`) REFERENCES \`user_tariff_payments\`(\`id\`) ON DELETE CASCADE
      ) DEFAULT CHARSET=utf8mb4
    `);
    return;
  }

  if (!(await columnExists(prisma, 'lessons', 'proposed_by'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`lessons\`
        ADD COLUMN \`proposed_by\` ENUM('teacher', 'student') NULL
    `);
  }
}
