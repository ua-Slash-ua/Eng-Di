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

export async function migrateLessonPresentations(prisma: PrismaClient) {
  if (await tableExists(prisma, 'lesson_presentations')) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE \`lesson_presentations\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`content_lesson_id\` INT UNSIGNED NULL,
      \`teacher_lesson_id\` INT UNSIGNED NULL,
      \`original_name\` VARCHAR(255) NOT NULL,
      \`url\` VARCHAR(500) NOT NULL,
      \`mime\` VARCHAR(120) NOT NULL,
      \`size_bytes\` INT UNSIGNED NOT NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`lesson_presentations_content_lesson_id_key\` (\`content_lesson_id\`),
      UNIQUE KEY \`lesson_presentations_teacher_lesson_id_key\` (\`teacher_lesson_id\`),
      CONSTRAINT \`lesson_presentations_content_lesson_id_fkey\`
        FOREIGN KEY (\`content_lesson_id\`) REFERENCES \`content_lessons\`(\`id\`)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`lesson_presentations_teacher_lesson_id_fkey\`
        FOREIGN KEY (\`teacher_lesson_id\`) REFERENCES \`teacher_lessons\`(\`id\`)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}
