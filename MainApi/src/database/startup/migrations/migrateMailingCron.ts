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

export async function migrateMailingCron(prisma: PrismaClient) {
  if (!(await tableExists(prisma, 'mailing_cron_runs'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`mailing_cron_runs\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`action\` VARCHAR(40) NOT NULL,
        \`status\` VARCHAR(20) NOT NULL,
        \`started_at\` DATETIME(3) NOT NULL,
        \`finished_at\` DATETIME(3) NULL,
        \`scanned\` INT NOT NULL DEFAULT 0,
        \`enqueued\` INT NOT NULL DEFAULT 0,
        \`cancelled\` INT NOT NULL DEFAULT 0,
        \`claimed\` INT NOT NULL DEFAULT 0,
        \`sent\` INT NOT NULL DEFAULT 0,
        \`skipped\` INT NOT NULL DEFAULT 0,
        \`failed\` INT NOT NULL DEFAULT 0,
        \`overdue\` INT NOT NULL DEFAULT 0,
        \`error\` VARCHAR(500) NULL,
        \`details\` JSON NULL,
        PRIMARY KEY (\`id\`),
        KEY \`mailing_cron_runs_started_at_idx\` (\`started_at\`),
        KEY \`mailing_cron_runs_action_started_at_idx\` (\`action\`, \`started_at\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (await tableExists(prisma, 'mailing_tasks')) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE \`mailing_tasks\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`kind\` VARCHAR(40) NOT NULL,
      \`mailing_type\` VARCHAR(40) NOT NULL,
      \`audience\` VARCHAR(20) NOT NULL,
      \`status\` VARCHAR(20) NOT NULL,
      \`scheduled_at\` DATETIME(3) NOT NULL,
      \`email\` VARCHAR(191) NOT NULL,
      \`user_id\` INT UNSIGNED NULL,
      \`lesson_id\` INT UNSIGNED NULL,
      \`cron_run_id\` INT UNSIGNED NULL,
      \`mailing_log_id\` INT UNSIGNED NULL,
      \`reason\` VARCHAR(255) NOT NULL,
      \`payload\` JSON NOT NULL,
      \`error\` VARCHAR(500) NULL,
      \`error_raw\` TEXT NULL,
      \`claimed_at\` DATETIME(3) NULL,
      \`processed_at\` DATETIME(3) NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`mailing_tasks_kind_lesson_id_user_id_key\` (\`kind\`, \`lesson_id\`, \`user_id\`),
      KEY \`mailing_tasks_status_scheduled_at_idx\` (\`status\`, \`scheduled_at\`),
      KEY \`mailing_tasks_kind_status_idx\` (\`kind\`, \`status\`),
      KEY \`mailing_tasks_email_idx\` (\`email\`),
      KEY \`mailing_tasks_lesson_id_idx\` (\`lesson_id\`),
      CONSTRAINT \`mailing_tasks_user_id_fkey\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT \`mailing_tasks_lesson_id_fkey\`
        FOREIGN KEY (\`lesson_id\`) REFERENCES \`lessons\`(\`id\`)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`mailing_tasks_cron_run_id_fkey\`
        FOREIGN KEY (\`cron_run_id\`) REFERENCES \`mailing_cron_runs\`(\`id\`)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}
