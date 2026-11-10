const CUR = 'engdi-cabinet-cur';
const PREV = 'engdi-cabinet-prev';

function normalizePath(href: string) {
  try {
    const url = href.startsWith('http') ? new URL(href) : new URL(href, 'http://local');
    return (url.pathname.replace(/\/$/, '') || '/') + url.search;
  } catch {
    return href.replace(/\/$/, '') || '/';
  }
}

export function rememberCabinetPath(pathname: string | null) {
  if (typeof window === 'undefined' || !pathname) return;
  const cur = sessionStorage.getItem(CUR);
  if (cur && cur !== pathname) {
    sessionStorage.setItem(PREV, cur);
  }
  sessionStorage.setItem(CUR, pathname);
}

export function previousCabinetPath() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PREV);
}

export function sameCabinetPath(a: string | null | undefined, b: string) {
  if (!a) return false;
  return normalizePath(a) === normalizePath(b);
}
