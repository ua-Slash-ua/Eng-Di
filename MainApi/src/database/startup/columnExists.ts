import type { PrismaClient } from '@prisma/client';

export async function columnExists(prisma: PrismaClient, table: string, column: string) {
  const rows = await prisma.$queryRaw<Array<{ c: bigint | number }>>`
      SELECT COUNT(*) AS c
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ${table}
        AND COLUMN_NAME = ${column}
    `;
  return Number(rows[0]?.c ?? 0) > 0;
}
