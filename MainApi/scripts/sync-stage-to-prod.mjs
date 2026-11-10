/**
 * Applies schema to PROD and copies CMS content + users #7, #13 from STAGE.
 * Operational data (lessons, curriculum, tests, leads, mailings, …) stays empty.
 *
 * Usage: node scripts/sync-stage-to-prod.mjs --yes
 * Env:   DATABASE_URL_STAGE, DATABASE_URL_PROD in MainApi/.env
 */
import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import './load-env.mjs';

const USER_IDS = [7, 13];
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveUrl(envName) {
  const url = process.env[`DATABASE_URL_${envName}`]?.trim();
  if (!url?.startsWith('mysql://')) {
    throw new Error(`DATABASE_URL_${envName} is missing in MainApi/.env`);
  }
  return url;
}

async function copyRows(label, read, write) {
  const rows = await read();
  await write();
  console.log(`[copy] ${label}: ${rows.length} rows`);
}

function stripUser(row) {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name,
    firstName: row.firstName,
    lastName: row.lastName,
    middleName: row.middleName,
    birthDate: row.birthDate,
    phone: row.phone,
    avatarUrl: row.avatarUrl,
    userRole: row.userRole,
    teacherId: USER_IDS.includes(row.teacherId ?? -1) ? row.teacherId : null,
    isSuperAdmin: row.isSuperAdmin,
    status: row.status,
    adminRoleId: row.adminRoleId,
    activatedAt: row.activatedAt,
    pendingPassword: row.pendingPassword,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function stripReview(row) {
  return {
    ...row,
    userId: USER_IDS.includes(row.userId ?? -1) ? row.userId : null,
    teacherId: USER_IDS.includes(row.teacherId ?? -1) ? row.teacherId : null,
  };
}

async function resetTargetSchema(target) {
  await target.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const tables = await target.$queryRaw`SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`;
  for (const row of tables) {
    await target.$executeRawUnsafe(`DROP TABLE IF EXISTS \`${row.name}\``);
  }
  await target.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  console.log(`[sync] dropped ${tables.length} existing PROD tables`);
}

async function main() {
  if (!process.argv.includes('--yes')) {
    throw new Error('Refusing to overwrite PROD without --yes');
  }

  const sourceUrl = resolveUrl('STAGE');
  const targetUrl = resolveUrl('PROD');

  console.log('[sync] STAGE → PROD (CMS + users #7, #13)');

  process.env.ENV = 'PROD';
  process.env.DATABASE_URL = targetUrl;

  const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
  const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

  try {
    await resetTargetSchema(target);

    console.log('[sync] prisma db push on PROD…');
    const push = spawnSync(
      'npx',
      ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'],
      {
        cwd: root,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, DATABASE_URL: targetUrl },
      },
    );
    if (push.status !== 0) {
      throw new Error('prisma db push failed after reset');
    }

    await target.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');

    const clearOrder = [
      'page_sections',
      'page_seo',
      'page_blocks',
      'pages',
      'blocks_meta',
      'blocks',
      'icons',
      'icon_groups',
      'reviews',
      'faqs',
      'school_rules',
      'tariffs',
      'formats',
      'about_stats',
      'about_stat_categories',
      'lead_categories',
      'settings',
      'admin_role_permissions',
      'admin_roles',
      'permissions',
      'users',
    ];
    for (const table of clearOrder) {
      await target.$executeRawUnsafe(`DELETE FROM \`${table}\``);
    }

    await copyRows(
      'permissions',
      () => source.permission.findMany(),
      async () => {
        const rows = await source.permission.findMany();
        if (rows.length) await target.permission.createMany({ data: rows });
      },
    );

    await copyRows(
      'admin_roles',
      () => source.adminRole.findMany(),
      async () => {
        const rows = await source.adminRole.findMany();
        if (rows.length) await target.adminRole.createMany({ data: rows });
      },
    );

    await copyRows(
      'admin_role_permissions',
      () => source.adminRolePermission.findMany(),
      async () => {
        const rows = await source.adminRolePermission.findMany();
        if (rows.length) await target.adminRolePermission.createMany({ data: rows });
      },
    );

    await copyRows(
      'settings',
      () => source.setting.findMany(),
      async () => {
        const rows = await source.setting.findMany();
        if (rows.length) await target.setting.createMany({ data: rows });
      },
    );

    await copyRows(
      'about_stat_categories',
      () => source.aboutStatCategory.findMany(),
      async () => {
        const rows = await source.aboutStatCategory.findMany();
        if (rows.length) await target.aboutStatCategory.createMany({ data: rows });
      },
    );

    await copyRows(
      'about_stats',
      () => source.aboutStat.findMany(),
      async () => {
        const rows = await source.aboutStat.findMany();
        if (rows.length) await target.aboutStat.createMany({ data: rows });
      },
    );

    await copyRows(
      'formats',
      () => source.format.findMany(),
      async () => {
        const rows = await source.format.findMany();
        if (rows.length) await target.format.createMany({ data: rows });
      },
    );

    await copyRows(
      'tariffs',
      () => source.tariff.findMany(),
      async () => {
        const rows = await source.tariff.findMany();
        if (rows.length) await target.tariff.createMany({ data: rows });
      },
    );

    await copyRows(
      'school_rules',
      () => source.schoolRule.findMany(),
      async () => {
        const rows = await source.schoolRule.findMany();
        if (rows.length) await target.schoolRule.createMany({ data: rows });
      },
    );

    await copyRows(
      'faqs',
      () => source.faq.findMany(),
      async () => {
        const rows = await source.faq.findMany();
        if (rows.length) await target.faq.createMany({ data: rows });
      },
    );

    await copyRows(
      'icon_groups',
      () => source.iconGroup.findMany(),
      async () => {
        const rows = await source.iconGroup.findMany();
        if (rows.length) await target.iconGroup.createMany({ data: rows });
      },
    );

    await copyRows(
      'icons',
      () => source.icon.findMany(),
      async () => {
        const rows = await source.icon.findMany();
        if (rows.length) await target.icon.createMany({ data: rows });
      },
    );

    await copyRows(
      'blocks',
      () => source.block.findMany(),
      async () => {
        const rows = await source.block.findMany();
        if (rows.length) await target.block.createMany({ data: rows });
      },
    );

    await copyRows(
      'blocks_meta',
      () => source.blockMeta.findMany(),
      async () => {
        const rows = await source.blockMeta.findMany();
        if (rows.length) await target.blockMeta.createMany({ data: rows });
      },
    );

    await copyRows(
      'pages',
      () => source.page.findMany(),
      async () => {
        const rows = await source.page.findMany();
        if (rows.length) await target.page.createMany({ data: rows });
      },
    );

    await copyRows(
      'page_seo',
      () => source.pageSeo.findMany(),
      async () => {
        const rows = await source.pageSeo.findMany();
        if (rows.length) await target.pageSeo.createMany({ data: rows });
      },
    );

    await copyRows(
      'page_blocks',
      () => source.pageBlock.findMany(),
      async () => {
        const rows = await source.pageBlock.findMany();
        if (rows.length) await target.pageBlock.createMany({ data: rows });
      },
    );

    await copyRows(
      'page_sections',
      () => source.pageSection.findMany(),
      async () => {
        const rows = await source.pageSection.findMany();
        if (rows.length) await target.pageSection.createMany({ data: rows });
      },
    );

    await copyRows(
      'lead_categories',
      () => source.leadCategory.findMany(),
      async () => {
        const rows = await source.leadCategory.findMany();
        if (rows.length) await target.leadCategory.createMany({ data: rows });
      },
    );

    const sourceUsers = await source.user.findMany({ where: { id: { in: USER_IDS } } });
    if (sourceUsers.length !== USER_IDS.length) {
      const found = sourceUsers.map((u) => u.id);
      const missing = USER_IDS.filter((id) => !found.includes(id));
      throw new Error(`Users not found in STAGE: ${missing.join(', ')}`);
    }
    for (const u of sourceUsers) {
      await target.user.create({ data: stripUser(u) });
    }
    console.log(`[copy] users: ${sourceUsers.map((u) => `#${u.id} ${u.email}`).join(', ')}`);

    await copyRows(
      'reviews',
      () => source.review.findMany(),
      async () => {
        const rows = (await source.review.findMany()).map(stripReview);
        if (rows.length) await target.review.createMany({ data: rows });
      },
    );

    await target.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');

    console.log('[sync] done — PROD has CMS content + users #7, #13');
    console.log('[sync] on hosting set ENV=PROD in api/.env and restart MainApi');
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
