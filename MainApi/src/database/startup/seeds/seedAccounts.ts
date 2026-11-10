import type { ConfigService } from '@nestjs/config';
import type { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function ensureAccount(
  prisma: PrismaClient,
  data: {
    email: string;
    name: string;
    password: string;
    userRole?: 'student' | 'teacher' | null;
    isSuperAdmin?: boolean;
    adminRoleId?: number | null;
  },
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    if (data.isSuperAdmin && !existing.isSuperAdmin) {
      await prisma.user.update({
        where: { email: data.email },
        data: { isSuperAdmin: true },
      });
    }
    return;
  }

  await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      userRole: data.userRole ?? null,
      isSuperAdmin: data.isSuperAdmin ?? false,
      passwordHash: await bcrypt.hash(data.password, 12),
      adminRoleId: data.adminRoleId ?? null,
      activatedAt: new Date(),
      pendingPassword: null,
    },
  });
}

export async function seedAccounts(prisma: PrismaClient, config: ConfigService) {
  await ensureAccount(prisma, {
    email: (config.get<string>('ADMIN_EMAIL') ?? 'admin@engdi.local').toLowerCase(),
    name: config.get<string>('ADMIN_NAME') ?? 'Administrator',
    isSuperAdmin: true,
    password: config.getOrThrow<string>('ADMIN_PASSWORD'),
    adminRoleId: null,
  });
}
