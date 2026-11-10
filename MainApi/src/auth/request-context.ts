import type { Request } from 'express';

export type AuthPanel = 'user' | 'admin';

export function getRequestIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim().slice(0, 64);
  }
  return (req.ip || req.socket.remoteAddress || null)?.slice(0, 64) ?? null;
}

export function getUserAgent(req: Request): string | null {
  const value = req.headers['user-agent'];
  if (!value) {
    return null;
  }
  return value.slice(0, 320);
}

export function getRequestPanel(req: Request): AuthPanel {
  const header = req.headers['x-engdi-panel'];
  return header === 'admin' ? 'admin' : 'user';
}
