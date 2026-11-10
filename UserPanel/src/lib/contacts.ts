import { API_URL } from './page';

export type ContactSocial = {
  label: string;
  url: string;
};

export type SiteContacts = {
  email: string;
  phone: string;
  phoneHref: string;
  socials: ContactSocial[];
};

const FALLBACK: SiteContacts = {
  email: 'hello@engdi.com',
  phone: '+380 63 000 00 00',
  phoneHref: 'tel:+380630000000',
  socials: [
    { label: 'Instagram', url: 'https://instagram.com/' },
    { label: 'Telegram', url: 'https://t.me/' },
  ],
};

export async function fetchContacts(): Promise<SiteContacts> {
  try {
    const response = await fetch(`${API_URL}/api/settings/contacts`, { cache: 'no-store' });
    if (!response.ok) {
      return FALLBACK;
    }
    const payload = (await response.json()) as {
      settings?: { email?: string; phone?: string; socials?: ContactSocial[] };
      phoneHref?: string;
    };
    const settings = payload.settings;
    if (!settings) return FALLBACK;
    return {
      email: settings.email?.trim() || FALLBACK.email,
      phone: settings.phone?.trim() || FALLBACK.phone,
      phoneHref: payload.phoneHref?.trim() || FALLBACK.phoneHref,
      socials: Array.isArray(settings.socials)
        ? settings.socials.filter((item) => item?.label?.trim())
        : FALLBACK.socials,
    };
  } catch {
    return FALLBACK;
  }
}
