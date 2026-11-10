import { API_URL } from './page';

export type SiteBranding = {
  logoUrl: string | null;
  faviconUrl: string | null;
};

const FALLBACK: SiteBranding = {
  logoUrl: null,
  faviconUrl: null,
};

export async function fetchBranding(): Promise<SiteBranding> {
  try {
    const response = await fetch(`${API_URL}/api/settings/branding`, { cache: 'no-store' });
    if (!response.ok) return FALLBACK;
    const payload = (await response.json()) as { settings?: Partial<SiteBranding> };
    return {
      logoUrl: payload.settings?.logoUrl?.trim() || null,
      faviconUrl: payload.settings?.faviconUrl?.trim() || null,
    };
  } catch {
    return FALLBACK;
  }
}
