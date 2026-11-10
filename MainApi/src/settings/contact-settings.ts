export const CONTACTS_SETTING_KEY = 'contacts';

export type ContactSocial = {
  label: string;
  url: string;
};

export type ContactsSettings = {
  email: string;
  phone: string;
  socials: ContactSocial[];
};

export const DEFAULT_CONTACTS_SETTINGS: ContactsSettings = {
  email: 'hello@engdi.com',
  phone: '+380 63 000 00 00',
  socials: [
    { label: 'Instagram', url: 'https://instagram.com/' },
    { label: 'Telegram', url: 'https://t.me/' },
  ],
};

const SOCIALS_LIMIT = 12;

export function normalizeContactsSettings(raw: unknown): ContactsSettings {
  const base: ContactsSettings = {
    email: DEFAULT_CONTACTS_SETTINGS.email,
    phone: DEFAULT_CONTACTS_SETTINGS.phone,
    socials: DEFAULT_CONTACTS_SETTINGS.socials.map((item) => ({ ...item })),
  };
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<ContactsSettings>;

  if (typeof data.email === 'string') {
    base.email = data.email.trim().slice(0, 120);
  }
  if (typeof data.phone === 'string') {
    base.phone = data.phone.trim().slice(0, 40);
  }
  if (Array.isArray(data.socials)) {
    base.socials = data.socials
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const item = entry as Partial<ContactSocial>;
        const label = typeof item.label === 'string' ? item.label.trim().slice(0, 40) : '';
        const url = sanitizeSocialUrl(typeof item.url === 'string' ? item.url : '');
        if (!label) return null;
        return { label, url };
      })
      .filter((item): item is ContactSocial => Boolean(item))
      .slice(0, SOCIALS_LIMIT);
  }
  return base;
}

export function phoneHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  if (!digits) return '';
  return digits.startsWith('+') ? `tel:${digits}` : `tel:+${digits}`;
}

function sanitizeSocialUrl(raw: string) {
  const value = raw.trim().slice(0, 300);
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('/') || value.startsWith('#')) {
    return value;
  }
  return `https://${value}`;
}
