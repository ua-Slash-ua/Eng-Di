export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

/** Standard list controls plus whatever per-column filter params a resource supports. */
export type ListParams = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
} & Record<string, string | number | boolean | null | undefined>;

export function listQuery(query: Record<string, string | number | boolean | null | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
