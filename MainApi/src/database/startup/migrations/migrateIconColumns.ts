import type { PrismaClient } from '@prisma/client';
import { EMOJI_TO_SVG } from '../iconSvgs';

const ICON_TABLES = ['about_stats', 'formats', 'tariffs'] as const;

export async function migrateIconColumns(prisma: PrismaClient) {
  for (const table of ICON_TABLES) {
    const rows = await prisma.$queryRaw<Array<{ DATA_TYPE: string; CHARACTER_MAXIMUM_LENGTH: number | null }>>`
      SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ${table}
        AND COLUMN_NAME = 'icon'
    `;
    const column = rows[0];
    if (!column) {
      continue;
    }
    const isShortVarchar =
      column.DATA_TYPE === 'varchar' && (column.CHARACTER_MAXIMUM_LENGTH ?? 0) <= 16;
    if (isShortVarchar) {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` MODIFY \`icon\` TEXT NULL`);
    }
  }

  for (const [emoji, svg] of Object.entries(EMOJI_TO_SVG)) {
    for (const table of ICON_TABLES) {
      await prisma.$executeRawUnsafe(`UPDATE \`${table}\` SET \`icon\` = ? WHERE \`icon\` = ?`, svg, emoji);
    }
  }
}
