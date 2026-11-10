import type { Request } from 'express';
import type { AuthPanel } from './request-context';

export const LEGACY_ACCESS_COOKIE = 'engdi_access';
export const LEGACY_REFRESH_COOKIE = 'engdi_refresh';

export function accessCookieName(panel: AuthPanel) {
  return panel === 'admin' ? 'engdi_admin_access' : 'engdi_user_access';
}

export function refreshCookieName(panel: AuthPanel) {
  return panel === 'admin' ? 'engdi_admin_refresh' : 'engdi_user_refresh';
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) {
    return undefined;
  }
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) {
      continue;
    }
    const key = part.slice(0, idx).trim();
    if (key === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return part.slice(idx + 1).trim();
      }
    }
  }
  return undefined;
}

export function readBearer(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }
  const token = header.slice(7).trim();
  return token || undefined;
}

export function readAccessToken(req: Request, panel: AuthPanel): string | undefined {
  return (
    readCookie(req, accessCookieName(panel)) ||
    readCookie(req, LEGACY_ACCESS_COOKIE) ||
    readBearer(req)
  );
}

export function readRefreshToken(req: Request, panel: AuthPanel): string | undefined {
  return readCookie(req, refreshCookieName(panel)) || readCookie(req, LEGACY_REFRESH_COOKIE);
}
