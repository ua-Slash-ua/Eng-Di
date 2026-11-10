import type { PrismaClient } from '@prisma/client';
import {
  CONTENT_WRITE_KEYS,
  MANAGER_PERMISSION_KEYS,
  READ_ONLY_PERMISSION_KEYS,
} from '../../../auth/permissions.catalog';

type RoleSeed = {
  name: string;
  slug: string;
  description: string;
  permissionKeys: string[];
};

const SYSTEM_ROLES: RoleSeed[] = [
  {
    name: 'Менеджер',
    slug: 'manager',
    description: 'Користувачі, ліди та аналітика',
    permissionKeys: MANAGER_PERMISSION_KEYS,
  },
  {
    name: 'Редактор контенту',
    slug: 'content-editor',
    description: 'Сторінки, блоки, іконки та довідники контенту',
    permissionKeys: CONTENT_WRITE_KEYS,
  },
  {
    name: 'Перегляд',
    slug: 'read-only',
    description: 'Лише читання основних розділів',
    permissionKeys: READ_ONLY_PERMISSION_KEYS,
  },
];

async function syncRolePermissions(prisma: PrismaClient, adminRoleId: number, keys: string[]) {
  const permissions = await prisma.permission.findMany({ where: { key: { in: keys } } });
  await prisma.adminRolePermission.deleteMany({ where: { adminRoleId } });
  if (permissions.length) {
    await prisma.adminRolePermission.createMany({
      data: permissions.map((p) => ({ adminRoleId, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
}

export async function seedAdminRoles(prisma: PrismaClient) {
  for (const role of SYSTEM_ROLES) {
    const row = await prisma.adminRole.upsert({
      where: { slug: role.slug },
      create: {
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: true,
      },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    });
    await syncRolePermissions(prisma, row.id, role.permissionKeys);
  }
}
