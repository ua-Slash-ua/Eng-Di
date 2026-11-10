export const HOME_SLUG = '/';

export function isHomeSlug(slug: string): boolean {
  const value = slug.trim().toLowerCase();
  return value === '/' || value === '' || value === 'home';
}

export function normalizeSlug(slug: string): string {
  const value = slug.trim().toLowerCase();
  if (isHomeSlug(value)) {
    return HOME_SLUG;
  }
  return value.replace(/^\/+/g, '');
}
