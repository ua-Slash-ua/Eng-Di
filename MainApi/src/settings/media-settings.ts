export const MEDIA_SETTING_KEY = 'media';

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

export const IMAGE_FORMAT_OPTIONS: MediaFormatOption[] = [
  { id: 'jpeg', label: 'JPEG', mimes: ['image/jpeg'], extensions: ['.jpg', '.jpeg'] },
  { id: 'png', label: 'PNG', mimes: ['image/png'], extensions: ['.png'] },
  { id: 'bmp', label: 'BMP', mimes: ['image/bmp', 'image/x-ms-bmp'], extensions: ['.bmp'] },
  { id: 'webp', label: 'WebP', mimes: ['image/webp'], extensions: ['.webp'] },
  { id: 'gif', label: 'GIF', mimes: ['image/gif'], extensions: ['.gif'] },
];

export const VIDEO_FORMAT_OPTIONS: MediaFormatOption[] = [
  { id: 'mp4', label: 'MP4', mimes: ['video/mp4'], extensions: ['.mp4'] },
  { id: 'webm', label: 'WebM', mimes: ['video/webm'], extensions: ['.webm'] },
  { id: 'mov', label: 'MOV', mimes: ['video/quicktime'], extensions: ['.mov'] },
  { id: 'mkv', label: 'MKV', mimes: ['video/x-matroska'], extensions: ['.mkv'] },
];

export const DEFAULT_MEDIA_SETTINGS: MediaSettings = {
  imageFormats: ['jpeg', 'png', 'webp', 'gif'],
  videoFormats: ['mp4', 'webm'],
  maxImageMb: 12,
  maxVideoMb: 100,
};

export function normalizeMediaSettings(raw: unknown): MediaSettings {
  const base = { ...DEFAULT_MEDIA_SETTINGS, imageFormats: [...DEFAULT_MEDIA_SETTINGS.imageFormats], videoFormats: [...DEFAULT_MEDIA_SETTINGS.videoFormats] };
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<MediaSettings>;

  if (Array.isArray(data.imageFormats)) {
    const allowed = new Set(IMAGE_FORMAT_OPTIONS.map((item) => item.id));
    base.imageFormats = data.imageFormats.filter((id): id is string => typeof id === 'string' && allowed.has(id));
    if (!base.imageFormats.length) base.imageFormats = [...DEFAULT_MEDIA_SETTINGS.imageFormats];
  }
  if (Array.isArray(data.videoFormats)) {
    const allowed = new Set(VIDEO_FORMAT_OPTIONS.map((item) => item.id));
    base.videoFormats = data.videoFormats.filter((id): id is string => typeof id === 'string' && allowed.has(id));
    if (!base.videoFormats.length) base.videoFormats = [...DEFAULT_MEDIA_SETTINGS.videoFormats];
  }
  if (typeof data.maxImageMb === 'number' && Number.isFinite(data.maxImageMb)) {
    base.maxImageMb = Math.min(200, Math.max(1, Math.round(data.maxImageMb)));
  }
  if (typeof data.maxVideoMb === 'number' && Number.isFinite(data.maxVideoMb)) {
    base.maxVideoMb = Math.min(2048, Math.max(1, Math.round(data.maxVideoMb)));
  }
  return base;
}

export function mimesForFormats(options: MediaFormatOption[], ids: string[]) {
  const selected = new Set(ids);
  return options.filter((item) => selected.has(item.id)).flatMap((item) => item.mimes);
}

export function acceptForFormats(options: MediaFormatOption[], ids: string[]) {
  const selected = new Set(ids);
  return options
    .filter((item) => selected.has(item.id))
    .flatMap((item) => [...item.extensions, ...item.mimes])
    .join(',');
}

export function mbToBytes(mb: number) {
  return Math.max(1, mb) * 1024 * 1024;
}
