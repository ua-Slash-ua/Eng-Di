export type { User, UserPanelRole } from './roles';
export { canAccessUserPanel, cabinetBasePath } from './roles';

const PANEL = 'user';
const SKIP_REFRESH = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/page-view',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];
const SKIP_UNAUTHORIZED_REDIRECT = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/page-view',
  '/api/auth/me',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/password',
];

let refreshPromise: Promise<boolean> | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

function withPanelHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-EngDi-Panel', PANEL);
  return headers;
}

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-EngDi-Panel': PANEL },
    })
      .then((response) => response.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = withPanelHeaders(options);
  const request = { ...options, headers, credentials: 'include' as const };
  let response = await fetch(path, request);

  if (response.status === 401 && !SKIP_REFRESH.some((prefix) => path.startsWith(prefix))) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await fetch(path, request);
    }
  }

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    if (response.status === 401 && !SKIP_UNAUTHORIZED_REDIRECT.some((prefix) => path.startsWith(prefix))) {
      unauthorizedHandler?.();
    }
    throw new Error(data.error || 'Помилка запиту');
  }
  return data;
}
