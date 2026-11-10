export const PRESENTATION_SETTING_KEY = 'presentations';

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

export const PRESENTATION_FORMAT_OPTIONS: PresentationFormatOption[] = [
  { id: 'pdf', label: 'PDF', mimes: ['application/pdf'], extensions: ['.pdf'] },
  {
    id: 'pptx',
    label: 'PowerPoint (PPTX)',
    mimes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    extensions: ['.pptx'],
  },
  {
    id: 'ppt',
    label: 'PowerPoint (PPT)',
    mimes: ['application/vnd.ms-powerpoint'],
    extensions: ['.ppt'],
  },
  {
    id: 'odp',
    label: 'OpenDocument (ODP)',
    mimes: ['application/vnd.oasis.opendocument.presentation'],
    extensions: ['.odp'],
  },
  {
    id: 'key',
    label: 'Keynote (KEY)',
    mimes: ['application/vnd.apple.keynote', 'application/x-iwork-keynote-sffkey'],
    extensions: ['.key'],
  },
];

export const DEFAULT_PRESENTATION_SETTINGS: PresentationSettings = {
  formats: ['pdf', 'pptx', 'ppt', 'odp'],
  maxMb: 25,
};

export function normalizePresentationSettings(raw: unknown): PresentationSettings {
  const base = {
    ...DEFAULT_PRESENTATION_SETTINGS,
    formats: [...DEFAULT_PRESENTATION_SETTINGS.formats],
  };
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<PresentationSettings>;

  if (Array.isArray(data.formats)) {
    const allowed = new Set(PRESENTATION_FORMAT_OPTIONS.map((item) => item.id));
    base.formats = data.formats.filter((id): id is string => typeof id === 'string' && allowed.has(id));
    if (!base.formats.length) base.formats = [...DEFAULT_PRESENTATION_SETTINGS.formats];
  }
  if (typeof data.maxMb === 'number' && Number.isFinite(data.maxMb)) {
    base.maxMb = Math.min(512, Math.max(1, Math.round(data.maxMb)));
  }
  return base;
}

export function presentationMimesForFormats(ids: string[]) {
  const selected = new Set(ids);
  return PRESENTATION_FORMAT_OPTIONS.filter((item) => selected.has(item.id)).flatMap((item) => item.mimes);
}

export function presentationAcceptForFormats(ids: string[]) {
  const selected = new Set(ids);
  return PRESENTATION_FORMAT_OPTIONS.filter((item) => selected.has(item.id))
    .flatMap((item) => [...item.extensions, ...item.mimes])
    .join(',');
}
