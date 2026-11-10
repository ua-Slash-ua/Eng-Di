import type { PrismaClient } from '@prisma/client';
import { PERMISSION_CATALOG } from '../../../auth/permissions.catalog';

export async function seedPermissions(prisma: PrismaClient) {
  for (const item of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: item.key },
      create: item,
      update: {
        resource: item.resource,
        action: item.action,
        label: item.label,
        groupLabel: item.groupLabel,
      },
    });
  }
}
