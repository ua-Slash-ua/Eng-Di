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

export async function migrateTests(prisma: PrismaClient) {
  if (!(await tableExists(prisma, 'tests'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`tests\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(220) NOT NULL,
        \`description\` VARCHAR(500) NULL,
        \`kind\` ENUM('free', 'material') NOT NULL DEFAULT 'free',
        \`entity_type\` ENUM('level', 'course', 'unit', 'lesson') NULL,
        \`entity_id\` INT UNSIGNED NULL,
        \`access_duration\` ENUM('m1', 'm5', 'm15', 'h1', 'forever') NOT NULL DEFAULT 'forever',
        \`entry_password\` VARCHAR(64) NOT NULL,
        \`randomize\` BOOLEAN NOT NULL DEFAULT false,
        \`max_attempts\` INT NOT NULL DEFAULT 3,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`tests_kind_idx\` (\`kind\`),
        KEY \`tests_entity_type_entity_id_idx\` (\`entity_type\`, \`entity_id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  } else if (!(await columnExists(prisma, 'tests', 'max_attempts'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`tests\`
        ADD COLUMN \`max_attempts\` INT NOT NULL DEFAULT 3 AFTER \`randomize\`
    `);
  }

  if (!(await tableExists(prisma, 'test_questions'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`test_questions\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`test_id\` INT UNSIGNED NOT NULL,
        \`prompt\` VARCHAR(1000) NOT NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`test_questions_test_id_idx\` (\`test_id\`),
        CONSTRAINT \`test_questions_test_id_fkey\`
          FOREIGN KEY (\`test_id\`) REFERENCES \`tests\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'test_answer_options'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`test_answer_options\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`question_id\` INT UNSIGNED NOT NULL,
        \`text\` VARCHAR(500) NOT NULL,
        \`kind\` ENUM('choice', 'write_in') NOT NULL DEFAULT 'choice',
        \`is_correct\` BOOLEAN NOT NULL DEFAULT false,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`test_answer_options_question_id_idx\` (\`question_id\`),
        CONSTRAINT \`test_answer_options_question_id_fkey\`
          FOREIGN KEY (\`question_id\`) REFERENCES \`test_questions\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'test_access_grants'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`test_access_grants\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`test_id\` INT UNSIGNED NOT NULL,
        \`granted_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`expires_at\` DATETIME(3) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`test_access_grants_user_id_test_id_key\` (\`user_id\`, \`test_id\`),
        KEY \`test_access_grants_test_id_idx\` (\`test_id\`),
        KEY \`test_access_grants_expires_at_idx\` (\`expires_at\`),
        CONSTRAINT \`test_access_grants_user_id_fkey\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`test_access_grants_test_id_fkey\`
          FOREIGN KEY (\`test_id\`) REFERENCES \`tests\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'test_attempts'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`test_attempts\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`test_id\` INT UNSIGNED NOT NULL,
        \`status\` ENUM('in_progress', 'submitted', 'expired') NOT NULL DEFAULT 'in_progress',
        \`score\` INT NULL,
        \`order_snapshot\` JSON NULL,
        \`started_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`submitted_at\` DATETIME(3) NULL,
        PRIMARY KEY (\`id\`),
        KEY \`test_attempts_test_id_idx\` (\`test_id\`),
        KEY \`test_attempts_user_id_idx\` (\`user_id\`),
        KEY \`test_attempts_status_idx\` (\`status\`),
        CONSTRAINT \`test_attempts_user_id_fkey\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`test_attempts_test_id_fkey\`
          FOREIGN KEY (\`test_id\`) REFERENCES \`tests\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'test_attempt_answers'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`test_attempt_answers\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`attempt_id\` INT UNSIGNED NOT NULL,
        \`question_id\` INT UNSIGNED NOT NULL,
        \`selected_option_ids\` JSON NOT NULL,
        \`written_text\` VARCHAR(500) NULL,
        \`is_correct\` BOOLEAN NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`test_attempt_answers_attempt_id_question_id_key\` (\`attempt_id\`, \`question_id\`),
        KEY \`test_attempt_answers_attempt_id_idx\` (\`attempt_id\`),
        CONSTRAINT \`test_attempt_answers_attempt_id_fkey\`
          FOREIGN KEY (\`attempt_id\`) REFERENCES \`test_attempts\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`test_attempt_answers_question_id_fkey\`
          FOREIGN KEY (\`question_id\`) REFERENCES \`test_questions\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'test_attempt_quotas'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`test_attempt_quotas\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`test_id\` INT UNSIGNED NOT NULL,
        \`extra_attempts\` INT NOT NULL DEFAULT 0,
        \`granted_by_id\` INT UNSIGNED NULL,
        \`updated_at\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`test_attempt_quotas_user_id_test_id_key\` (\`user_id\`, \`test_id\`),
        KEY \`test_attempt_quotas_test_id_idx\` (\`test_id\`),
        CONSTRAINT \`test_attempt_quotas_user_id_fkey\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`test_attempt_quotas_test_id_fkey\`
          FOREIGN KEY (\`test_id\`) REFERENCES \`tests\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`test_attempt_quotas_granted_by_id_fkey\`
          FOREIGN KEY (\`granted_by_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }
}
