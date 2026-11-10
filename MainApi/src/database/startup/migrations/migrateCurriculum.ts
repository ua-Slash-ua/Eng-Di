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

export async function migrateCurriculum(prisma: PrismaClient) {
  if (!(await tableExists(prisma, 'content_levels'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`content_levels\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`code\` VARCHAR(8) NOT NULL,
        \`title\` VARCHAR(100) NOT NULL,
        \`description\` VARCHAR(320) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`content_levels_code_key\` (\`code\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'content_courses'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`content_courses\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`level_id\` INT UNSIGNED NULL,
        \`title\` VARCHAR(180) NOT NULL,
        \`description\` VARCHAR(500) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`content_courses_level_id_idx\` (\`level_id\`),
        CONSTRAINT \`content_courses_level_id_fkey\`
          FOREIGN KEY (\`level_id\`) REFERENCES \`content_levels\`(\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'content_units'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`content_units\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`course_id\` INT UNSIGNED NULL,
        \`title\` VARCHAR(180) NOT NULL,
        \`description\` VARCHAR(500) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`content_units_course_id_idx\` (\`course_id\`),
        CONSTRAINT \`content_units_course_id_fkey\`
          FOREIGN KEY (\`course_id\`) REFERENCES \`content_courses\`(\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'content_lessons'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`content_lessons\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`unit_id\` INT UNSIGNED NULL,
        \`title\` VARCHAR(220) NOT NULL,
        \`description\` VARCHAR(500) NULL,
        \`content\` JSON NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`content_lessons_unit_id_idx\` (\`unit_id\`),
        CONSTRAINT \`content_lessons_unit_id_fkey\`
          FOREIGN KEY (\`unit_id\`) REFERENCES \`content_units\`(\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'teacher_content_accesses'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`teacher_content_accesses\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`teacher_id\` INT UNSIGNED NOT NULL,
        \`entity_type\` ENUM('level', 'course', 'unit', 'lesson') NOT NULL,
        \`entity_id\` INT UNSIGNED NOT NULL,
        \`mode\` ENUM('readonly', 'fork') NOT NULL DEFAULT 'readonly',
        \`granted_by\` INT UNSIGNED NOT NULL,
        \`granted_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`teacher_content_accesses_teacher_id_entity_type_entity_id_key\`
          (\`teacher_id\`, \`entity_type\`, \`entity_id\`),
        KEY \`teacher_content_accesses_teacher_id_idx\` (\`teacher_id\`),
        KEY \`teacher_content_accesses_entity_type_entity_id_idx\` (\`entity_type\`, \`entity_id\`),
        CONSTRAINT \`teacher_content_accesses_teacher_id_fkey\`
          FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`teacher_content_accesses_granted_by_fkey\`
          FOREIGN KEY (\`granted_by\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'teacher_lessons'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`teacher_lessons\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`teacher_id\` INT UNSIGNED NOT NULL,
        \`source_lesson_id\` INT UNSIGNED NULL,
        \`title\` VARCHAR(220) NOT NULL,
        \`description\` VARCHAR(500) NULL,
        \`content\` JSON NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`teacher_lessons_teacher_id_idx\` (\`teacher_id\`),
        KEY \`teacher_lessons_source_lesson_id_idx\` (\`source_lesson_id\`),
        CONSTRAINT \`teacher_lessons_teacher_id_fkey\`
          FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`teacher_lessons_source_lesson_id_fkey\`
          FOREIGN KEY (\`source_lesson_id\`) REFERENCES \`content_lessons\`(\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'teacher_units'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`teacher_units\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`teacher_id\` INT UNSIGNED NOT NULL,
        \`source_unit_id\` INT UNSIGNED NULL,
        \`title\` VARCHAR(180) NOT NULL,
        \`mode\` ENUM('readonly', 'fork') NOT NULL DEFAULT 'readonly',
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`teacher_units_teacher_id_idx\` (\`teacher_id\`),
        KEY \`teacher_units_source_unit_id_idx\` (\`source_unit_id\`),
        CONSTRAINT \`teacher_units_teacher_id_fkey\`
          FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`teacher_units_source_unit_id_fkey\`
          FOREIGN KEY (\`source_unit_id\`) REFERENCES \`content_units\`(\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await tableExists(prisma, 'teacher_unit_lessons'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`teacher_unit_lessons\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`teacher_unit_id\` INT UNSIGNED NOT NULL,
        \`lesson_id\` INT UNSIGNED NOT NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`teacher_unit_lessons_teacher_unit_id_lesson_id_key\`
          (\`teacher_unit_id\`, \`lesson_id\`),
        KEY \`teacher_unit_lessons_teacher_unit_id_idx\` (\`teacher_unit_id\`),
        CONSTRAINT \`teacher_unit_lessons_teacher_unit_id_fkey\`
          FOREIGN KEY (\`teacher_unit_id\`) REFERENCES \`teacher_units\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`teacher_unit_lessons_lesson_id_fkey\`
          FOREIGN KEY (\`lesson_id\`) REFERENCES \`teacher_lessons\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }

  if (!(await columnExists(prisma, 'lessons', 'content_lesson_id'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`lessons\`
        ADD COLUMN \`content_lesson_id\` INT UNSIGNED NULL,
        ADD KEY \`lessons_content_lesson_id_fkey\` (\`content_lesson_id\`),
        ADD CONSTRAINT \`lessons_content_lesson_id_fkey\`
          FOREIGN KEY (\`content_lesson_id\`) REFERENCES \`content_lessons\`(\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  if (!(await columnExists(prisma, 'lessons', 'teacher_lesson_id'))) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`lessons\`
        ADD COLUMN \`teacher_lesson_id\` INT UNSIGNED NULL,
        ADD KEY \`lessons_teacher_lesson_id_fkey\` (\`teacher_lesson_id\`),
        ADD CONSTRAINT \`lessons_teacher_lesson_id_fkey\`
          FOREIGN KEY (\`teacher_lesson_id\`) REFERENCES \`teacher_lessons\`(\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }
}
