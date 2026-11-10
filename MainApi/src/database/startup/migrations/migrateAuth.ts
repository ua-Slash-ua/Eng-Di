import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateAuth(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'users', 'status'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`users\` ADD COLUMN \`status\` ENUM('active', 'blocked') NOT NULL DEFAULT 'active'`,
    );
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`auth_sessions\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`user_id\` INT UNSIGNED NOT NULL,
      \`family_id\` VARCHAR(36) NOT NULL,
      \`refresh_token_hash\` VARCHAR(64) NOT NULL,
      \`panel\` ENUM('user', 'admin') NOT NULL,
      \`ip\` VARCHAR(64) NULL,
      \`user_agent\` VARCHAR(320) NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`last_used_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`expires_at\` DATETIME(3) NOT NULL,
      \`revoked_at\` DATETIME(3) NULL,
      \`revoked_reason\` VARCHAR(40) NULL,
      \`replaced_by_id\` INT UNSIGNED NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`auth_sessions_refresh_token_hash_key\` (\`refresh_token_hash\`),
      INDEX \`auth_sessions_user_id_revoked_at_idx\` (\`user_id\`, \`revoked_at\`),
      INDEX \`auth_sessions_family_id_idx\` (\`family_id\`),
      INDEX \`auth_sessions_expires_at_idx\` (\`expires_at\`)
    ) DEFAULT CHARSET=utf8mb4
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`auth_events\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`user_id\` INT UNSIGNED NULL,
      \`session_id\` INT UNSIGNED NULL,
      \`type\` ENUM(
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'LOGOUT_ALL',
        'REFRESH',
        'REFRESH_REUSE',
        'SESSION_REVOKED',
        'PASSWORD_CHANGED',
        'PASSWORD_RESET',
        'PROFILE_UPDATED',
        'ACCOUNT_CREATED',
        'ACCOUNT_BLOCKED',
        'ACCOUNT_UNBLOCKED',
        'PAGE_VIEW'
      ) NOT NULL,
      \`panel\` ENUM('user', 'admin') NULL,
      \`path\` VARCHAR(180) NULL,
      \`ip\` VARCHAR(64) NULL,
      \`user_agent\` VARCHAR(320) NULL,
      \`meta\` JSON NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`auth_events_user_id_type_created_at_idx\` (\`user_id\`, \`type\`, \`created_at\`),
      INDEX \`auth_events_type_created_at_idx\` (\`type\`, \`created_at\`),
      INDEX \`auth_events_path_created_at_idx\` (\`path\`, \`created_at\`)
    ) DEFAULT CHARSET=utf8mb4
  `);

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`auth_sessions\`
        ADD CONSTRAINT \`auth_sessions_user_id_fkey\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
    `);
  } catch {
    /* already exists */
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`auth_events\`
        ADD CONSTRAINT \`auth_events_user_id_fkey\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
    `);
  } catch {
    /* already exists */
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`auth_events\`
        ADD CONSTRAINT \`auth_events_session_id_fkey\`
        FOREIGN KEY (\`session_id\`) REFERENCES \`auth_sessions\`(\`id\`) ON DELETE SET NULL
    `);
  } catch {
    /* already exists */
  }
}
