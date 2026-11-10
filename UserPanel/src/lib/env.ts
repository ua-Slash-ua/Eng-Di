export type AppEnv = 'PROD' | 'STAGE';

const VALID_ENVS: AppEnv[] = ['PROD', 'STAGE'];

export function currentAppEnv(): AppEnv {
  const raw = (process.env.ENV ?? 'STAGE').trim().toUpperCase();
  if (!VALID_ENVS.includes(raw as AppEnv)) {
    throw new Error(`ENV must be PROD or STAGE, got "${raw}"`);
  }
  return raw as AppEnv;
}

/** MainApi base URL from ENV (MAIN_API_URL_STAGE / MAIN_API_URL_PROD). */
export function resolveMainApiUrl(env = currentAppEnv()): string {
  const fromKey = process.env[`MAIN_API_URL_${env}`]?.trim();
  const fallback = process.env.MAIN_API_URL?.trim() || process.env.API_INTERNAL_URL?.trim();
  return fromKey || fallback || 'http://localhost:4000';
}

/** Allowed browser origins from CORS_ORIGINS (comma-separated). */
export function corsOrigins(): string[] {
  const fromList = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromList.length > 0) {
    return fromList;
  }
  return ['http://localhost:3000'];
}

export function corsOriginAllowed(origin: string | null): string | false {
  if (!origin) return false;
  return corsOrigins().includes(origin) ? origin : false;
}
