export const BRANDING_SETTING_KEY = 'branding';

export type BrandingSettings = {
  logoUrl: string | null;
  faviconUrl: string | null;
};

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  logoUrl: null,
  faviconUrl: null,
};

const LOGO_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);

const FAVICON_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/ico',
]);

export const LOGO_ACCEPT = '.png,.jpg,.jpeg,.webp,.svg,.gif';
export const FAVICON_ACCEPT = '.png,.jpg,.jpeg,.webp,.svg,.ico';
export const LOGO_MAX_MB = 8;
export const FAVICON_MAX_MB = 2;

export function brandingMimes(kind: 'logo' | 'favicon') {
  return kind === 'logo' ? LOGO_MIMES : FAVICON_MIMES;
}

export function brandingMaxBytes(kind: 'logo' | 'favicon') {
  return (kind === 'logo' ? LOGO_MAX_MB : FAVICON_MAX_MB) * 1024 * 1024;
}

export function normalizeBrandingSettings(raw: unknown): BrandingSettings {
  const base: BrandingSettings = { ...DEFAULT_BRANDING_SETTINGS };
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<BrandingSettings>;
  base.logoUrl = sanitizeAssetUrl(data.logoUrl);
  base.faviconUrl = sanitizeAssetUrl(data.faviconUrl);
  return base;
}

function sanitizeAssetUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  const url = value.trim().slice(0, 500);
  if (!url) return null;
  if (url.startsWith('/uploads/')) return url;
  return null;
}
