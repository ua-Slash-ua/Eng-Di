export type SortOrder = 'asc' | 'desc';

export type SortQuery = {
  sort?: string;
  order?: string;
};

/**
 * Maps a client sort key to a Prisma orderBy clause, falling back to the resource
 * default when the key is not whitelisted.
 */
export function resolveOrderBy<T>(query: SortQuery, allowed: Record<string, (order: SortOrder) => T>, fallback: T): T {
  const key = query.sort?.trim();
  if (!key || !allowed[key]) {
    return fallback;
  }
  const order: SortOrder = query.order === 'desc' ? 'desc' : 'asc';
  return allowed[key](order);
}
