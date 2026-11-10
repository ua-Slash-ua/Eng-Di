export type AppEnv = 'PROD' | 'STAGE';

const VALID_ENVS: AppEnv[] = ['PROD', 'STAGE'];

export function currentAppEnv(): AppEnv {
  const raw = (process.env.ENV ?? 'STAGE').trim().toUpperCase();
  if (!VALID_ENVS.includes(raw as AppEnv)) {
    throw new Error(`ENV must be PROD or STAGE, got "${raw}"`);
  }
  return raw as AppEnv;
}

/** Pick DATABASE_URL from ENV (DATABASE_URL_PROD / DATABASE_URL_STAGE). */
export function resolveDatabaseUrl(env = currentAppEnv()): string {
  const fromKey = process.env[`DATABASE_URL_${env}`]?.trim();
  const fallback = process.env.DATABASE_URL?.trim();
  const url = fromKey || fallback;
  if (!url?.startsWith('mysql://')) {
    throw new Error(
      `Database URL for ENV=${env} is missing. Set DATABASE_URL_${env} or DATABASE_URL in MainApi/.env`,
    );
  }
  return url;
}

/** Sets process.env.DATABASE_URL for Prisma CLI and runtime. */
export function applyDatabaseUrl(): AppEnv {
  const env = currentAppEnv();
  process.env.DATABASE_URL = resolveDatabaseUrl(env);
  return env;
}
