export type AboutStatListItem = {
  id: number;
  value: string;
  label: string;
  icon: string | null;
};

export type AboutStatItem = {
  id: number;
  value: string;
  label: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AboutStatUsage = {
  id: number;
  name: string;
  type: string;
};

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  hero: 'Герой',
};
