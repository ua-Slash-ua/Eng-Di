import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import './load-env.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/prisma-with-env.mjs <prisma-args...>');
  process.exit(1);
}

console.log(`[prisma] ENV=${process.env.ENV} → ${process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ':***@')}`);

const result = spawnSync('npx', ['prisma', ...args], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
