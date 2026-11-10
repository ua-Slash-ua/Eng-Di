import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(root, '.env'), override: true });

const VALID = ['PROD', 'STAGE'];
const env = (process.env.ENV ?? 'STAGE').trim().toUpperCase();

if (!VALID.includes(env)) {
  throw new Error(`ENV must be one of ${VALID.join(', ')}, got "${env}"`);
}

const fromKey = process.env[`DATABASE_URL_${env}`]?.trim();
const fallback = process.env.DATABASE_URL?.trim();
const url = fromKey || fallback;

if (!url?.startsWith('mysql://')) {
  throw new Error(`Database URL for ENV=${env} is missing. Set DATABASE_URL_${env} in MainApi/.env`);
}

process.env.DATABASE_URL = url;

export { env, url, root };
