import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

async function constraintExists(prisma: PrismaClient, name: string) {
  const rows = await prisma.$queryRaw<Array<{ c: bigint | number }>>`
      SELECT COUNT(*) AS c
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND CONSTRAINT_NAME = ${name}
    `;
  return Number(rows[0]?.c ?? 0) > 0;
}

export async function migrateTeacherStudents(prisma: PrismaClient) {
  if (!(await columnExists(prisma, 'users', 'teacher_id'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`users\`
        ADD COLUMN \`teacher_id\` INT UNSIGNED NULL AFTER \`user_role\`
    `);
  }

  if (!(await constraintExists(prisma, 'users_teacher_id_fkey'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`users\`
        ADD CONSTRAINT \`users_teacher_id_fkey\`
          FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
    `);
  }
}
