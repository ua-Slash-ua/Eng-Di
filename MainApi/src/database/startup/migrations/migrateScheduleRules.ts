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

export async function migrateScheduleRules(prisma: PrismaClient) {
  if (!(await tableExists(prisma, 'schedule_rules'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`schedule_rules\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`kind\` ENUM('work', 'busy') NOT NULL,
        \`scope\` ENUM('weekly', 'date', 'daily') NOT NULL,
        \`weekday\` INT NULL,
        \`date\` DATE NULL,
        \`start_minute\` INT NOT NULL,
        \`end_minute\` INT NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`schedule_rules_user_id_idx\` (\`user_id\`),
        CONSTRAINT \`schedule_rules_user_id_fkey\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) DEFAULT CHARSET=utf8mb4
    `);
    return;
  }

  const columns = await prisma.$queryRaw<Array<{ COLUMN_TYPE: string }>>`
    SELECT COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'schedule_rules'
      AND COLUMN_NAME = 'scope'
  `;
  if (!columns[0]?.COLUMN_TYPE.includes('daily')) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`schedule_rules\`
        MODIFY COLUMN \`scope\` ENUM('weekly', 'date', 'daily') NOT NULL
    `);
  }
}
