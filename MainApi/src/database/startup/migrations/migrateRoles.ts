import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateRoles(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`permissions\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`key\` VARCHAR(64) NOT NULL,
      \`resource\` VARCHAR(32) NOT NULL,
      \`action\` VARCHAR(16) NOT NULL,
      \`label\` VARCHAR(100) NOT NULL,
      \`group_label\` VARCHAR(64) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`permissions_key_key\` (\`key\`)
    ) DEFAULT CHARSET=utf8mb4
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`admin_roles\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`name\` VARCHAR(100) NOT NULL,
      \`slug\` VARCHAR(64) NOT NULL,
      \`description\` VARCHAR(255) NULL,
      \`is_system\` TINYINT(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`admin_roles_name_key\` (\`name\`),
      UNIQUE KEY \`admin_roles_slug_key\` (\`slug\`)
    ) DEFAULT CHARSET=utf8mb4
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`admin_role_permissions\` (
      \`admin_role_id\` INT UNSIGNED NOT NULL,
      \`permission_id\` INT UNSIGNED NOT NULL,
      PRIMARY KEY (\`admin_role_id\`, \`permission_id\`),
      CONSTRAINT \`admin_role_permissions_admin_role_id_fkey\`
        FOREIGN KEY (\`admin_role_id\`) REFERENCES \`admin_roles\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`admin_role_permissions_permission_id_fkey\`
        FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE
    ) DEFAULT CHARSET=utf8mb4
  `);

  if (!(await columnExists(prisma, 'users', 'admin_role_id'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`users\` ADD COLUMN \`admin_role_id\` INT UNSIGNED NULL`,
    );
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`users\`
          ADD CONSTRAINT \`users_admin_role_id_fkey\`
          FOREIGN KEY (\`admin_role_id\`) REFERENCES \`admin_roles\`(\`id\`) ON DELETE SET NULL
      `);
    } catch {
      /* already exists */
    }
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX \`users_admin_role_id_idx\` ON \`users\`(\`admin_role_id\`)`);
    } catch {
      /* already exists */
    }
  }

  // Legacy Role enum migration (skip if dual-access migration already dropped `role`)
  if (await columnExists(prisma, 'users', 'role')) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`users\` MODIFY \`role\` VARCHAR(20) NOT NULL DEFAULT 'student'`);
    await prisma.$executeRawUnsafe(`UPDATE \`users\` SET \`role\` = 'student' WHERE \`role\` = 'user'`);
    await prisma.$executeRawUnsafe(`UPDATE \`users\` SET \`role\` = 'super_admin' WHERE \`role\` = 'admin'`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`users\`
        MODIFY \`role\` ENUM('super_admin', 'admin', 'teacher', 'student') NOT NULL DEFAULT 'student'
    `);
  }
}
