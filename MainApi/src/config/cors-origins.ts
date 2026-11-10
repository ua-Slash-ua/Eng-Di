/** Allowed browser origins from CORS_ORIGINS (comma-separated). */
export function corsOrigins(): string[] {
  const fromList = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromList.length > 0) {
    return fromList;
  }
  return ['http://localhost:3000', 'http://localhost:3001'];
}
