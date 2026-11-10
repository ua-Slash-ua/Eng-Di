import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateDualAccess(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'users', 'user_role'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`users\`
        ADD COLUMN \`user_role\` ENUM('student', 'teacher') NULL AFTER \`phone\`,
        ADD COLUMN \`is_super_admin\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`user_role\`
    `);
  }

  if (await columnExists(prisma, 'users', 'role')) {
    await prisma.$executeRawUnsafe(`
      UPDATE \`users\` SET \`user_role\` = 'student' WHERE \`role\` = 'student'
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE \`users\` SET \`user_role\` = 'teacher' WHERE \`role\` = 'teacher'
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE \`users\` SET \`is_super_admin\` = 1 WHERE \`role\` = 'super_admin'
    `);
    await prisma.$executeRawUnsafe(`ALTER TABLE \`users\` DROP COLUMN \`role\``);
  }
}
