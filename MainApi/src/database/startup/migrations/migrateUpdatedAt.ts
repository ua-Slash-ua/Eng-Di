import type { PrismaClient } from '@prisma/client';
import { columnExists } from '../columnExists';

export async function migrateUpdatedAt(prisma: PrismaClient) {
  const tables = [
    'users',
    'pages',
    'page_seo',
    'page_blocks',
    'lead_categories',
    'leads',
    'about_stat_categories',
    'about_stats',
    'formats',
    'tariffs',
    'school_rules',
    'reviews',
    'blocks',
    'blocks_meta',
    'icon_groups',
    'icons',
  ];
  for (const table of tables) {
    if (await columnExists(prisma, table, 'updated_at')) {
      continue;
    }
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`${table}\` ADD COLUMN \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`,
    );
  }

  for (const table of ['page_seo', 'page_blocks']) {
    if (await columnExists(prisma, table, 'created_at')) {
      continue;
    }
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`${table}\` ADD COLUMN \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)`,
    );
  }
}
