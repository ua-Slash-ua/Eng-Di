export function splitParts(total: number, parts: number): number[] {
  const n = Math.max(1, Math.floor(parts) || 1);
  const safe = Math.max(0, Math.floor(total) || 0);
  const base = Math.floor(safe / n);
  const rem = safe % n;
  return Array.from({ length: n }, (_, index) => base + (index < rem ? 1 : 0));
}
