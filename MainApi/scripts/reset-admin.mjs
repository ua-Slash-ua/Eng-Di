import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env'),
  override: true,
});

const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? '';

if (!process.env.DATABASE_URL?.startsWith('mysql://')) {
  throw new Error('DATABASE_URL from MainApi/.env is missing or invalid');
}
if (!email || !password) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in MainApi/.env');
}

const prisma = new PrismaClient();

try {
  const deleted = await prisma.user.deleteMany({});
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: process.env.ADMIN_NAME?.trim() || 'Administrator',
      passwordHash,
      isSuperAdmin: true,
      userRole: null,
      adminRoleId: null,
    },
  });
  console.log(`Deleted users: ${deleted.count}`);
  console.log(`Created super admin #${user.id} (${user.email})`);
} finally {
  await prisma.$disconnect();
}
