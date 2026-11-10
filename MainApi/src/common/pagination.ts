export type ListQuery = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 10;

export function resolvePaging(query: ListQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.limit) || DEFAULT_PAGE_SIZE));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginate<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
  return { items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) };
}

export function searchTerm(q?: string): string | undefined {
  const term = q?.trim();
  return term ? term : undefined;
}
