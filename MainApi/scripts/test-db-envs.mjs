import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ override: true });

for (const env of ['STAGE', 'PROD']) {
  const url = process.env[`DATABASE_URL_${env}`]?.trim();
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const users = await prisma.user.count();
    const pages = await prisma.page.count();
    console.log(`${env}: OK — users=${users}, pages=${pages}`);
  } catch (err) {
    console.log(`${env}: FAIL — ${err.message.split('\n')[0]}`);
  } finally {
    await prisma.$disconnect();
  }
}
