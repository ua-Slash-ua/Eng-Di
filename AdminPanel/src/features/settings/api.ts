import { api } from '@/lib/api';

export type MediaSettings = {
  imageFormats: string[];
  videoFormats: string[];
  maxImageMb: number;
  maxVideoMb: number;
};

export type MediaFormatOption = {
  id: string;
  label: string;
  mimes: string[];
  extensions: string[];
};

export type MediaSettingsPayload = {
  settings: MediaSettings;
  imageFormatOptions: MediaFormatOption[];
  videoFormatOptions: MediaFormatOption[];
  imageAccept: string;
  videoAccept: string;
};

export type ContactSocial = {
  label: string;
  url: string;
};

export type ContactsSettings = {
  email: string;
  phone: string;
  socials: ContactSocial[];
};

export type ContactsSettingsPayload = {
  settings: ContactsSettings;
  phoneHref: string;
};

export type BrandingSettings = {
  logoUrl: string | null;
  faviconUrl: string | null;
};

export type BrandingSettingsPayload = {
  settings: BrandingSettings;
  logoAccept: string;
  faviconAccept: string;
  logoMaxMb: number;
  faviconMaxMb: number;
};

export type UiSettings = {
  showNewBadges: boolean;
};

export type UiSettingsPayload = {
  settings: UiSettings;
};

export type PresentationSettings = {
  formats: string[];
  maxMb: number;
};

export type PresentationFormatOption = {
  id: string;
  label: string;
  mimes: string[];
  extensions: string[];
};

export type PresentationSettingsPayload = {
  settings: PresentationSettings;
  formatOptions: PresentationFormatOption[];
  accept: string;
};

export const settingsApi = {
  getMedia: () => api<MediaSettingsPayload>('/api/admin/settings/media'),
  updateMedia: (body: MediaSettings) =>
    api<MediaSettingsPayload>('/api/admin/settings/media', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  getPresentations: () => api<PresentationSettingsPayload>('/api/admin/settings/presentations'),
  updatePresentations: (body: PresentationSettings) =>
    api<PresentationSettingsPayload>('/api/admin/settings/presentations', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  getContacts: () => api<ContactsSettingsPayload>('/api/admin/settings/contacts'),
  updateContacts: (body: ContactsSettings) =>
    api<ContactsSettingsPayload>('/api/admin/settings/contacts', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  getBranding: () => api<BrandingSettingsPayload>('/api/admin/settings/branding'),
  updateBranding: (body: Partial<BrandingSettings>) =>
    api<BrandingSettingsPayload>('/api/admin/settings/branding', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  getUi: () => api<UiSettingsPayload>('/api/admin/settings/ui'),
  updateUi: (body: Partial<UiSettings>) =>
    api<UiSettingsPayload>('/api/admin/settings/ui', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  uploadLogo: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return api<BrandingSettingsPayload>('/api/admin/settings/branding/logo', { method: 'POST', body });
  },
  uploadFavicon: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return api<BrandingSettingsPayload>('/api/admin/settings/branding/favicon', { method: 'POST', body });
  },
};
