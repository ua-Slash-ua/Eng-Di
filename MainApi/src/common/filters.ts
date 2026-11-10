/** Splits a `a,b,c` query value into distinct non-empty values. */
export function csvValues(value?: string): string[] | undefined {
  const parts = value
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts && parts.length ? Array.from(new Set(parts)) : undefined;
}

/** Same as `csvValues`, but keeps only members of the allowed set. */
export function csvEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T[] | undefined {
  const parts = csvValues(value)?.filter((part): part is T => (allowed as readonly string[]).includes(part));
  return parts && parts.length ? parts : undefined;
}

/** Same as `csvValues`, but keeps only finite numbers. */
export function csvNumbers(value?: string): number[] | undefined {
  const parts = csvValues(value)
    ?.map((part) => Number(part))
    .filter((part) => Number.isFinite(part));
  return parts && parts.length ? parts : undefined;
}

export function textFilter(value?: string): string | undefined {
  const term = value?.trim();
  return term ? term : undefined;
}
