export type MediaType = 'svg' | 'image' | 'video';

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  svg: 'SVG',
  image: 'Зображення',
  video: 'Відео',
};

export const MEDIA_TYPE_OPTIONS = (Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((value) => ({
  value,
  label: MEDIA_TYPE_LABELS[value],
}));

export type IconGroupRef = {
  id: number;
  slug: string;
  title: string;
  type?: string;
};

export type IconGroupItem = IconGroupRef & {
  type: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: { icons: number };
};

export type IconListItem = {
  id: number;
  name: string;
  slug: string;
  type: string;
  svg: string | null;
  url: string | null;
  alt: string | null;
  mime: string | null;
  sizeBytes: number | null;
  originalName: string | null;
  sortOrder: number;
  groupId: number | null;
  group: IconGroupRef | null;
};

export type IconItem = IconListItem & {
  createdAt: string;
  updatedAt: string;
};

export type IconCatalogItem = {
  id: number;
  name: string;
  slug: string;
  type: string;
  svg: string | null;
  url: string | null;
  alt: string | null;
  groupId: number | null;
  group: IconGroupRef | null;
};

export type UploadMetaItem = {
  name?: string;
  alt?: string;
  slug?: string;
  groupId?: number | null;
};
