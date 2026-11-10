export function initials(name: string, email = ''): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase() || 'E';
}

export function greeting(name: string): string {
  const hour = new Date().getHours();
  const first = name.trim().split(/\s+/)[0] || 'адміне';
  if (hour < 12) return `Доброго ранку, ${first}`;
  if (hour < 18) return `Доброго дня, ${first}`;
  return `Доброго вечора, ${first}`;
}

export function todayLabel(): string {
  return new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
}

export function pagePath(slug: string): string {
  if (!slug || slug === 'home' || slug === '/') {
    return '/';
  }
  return slug.startsWith('/') ? slug : `/${slug}`;
}

export function formatUah(amount: number): string {
  return amount.toLocaleString('uk-UA').replace(/[\u00A0\u202F]/g, ' ');
}

/** Human-readable file size: B / KB / MB / GB. */
export function formatBytes(size: number | null | undefined): string {
  if (size == null || !Number.isFinite(size) || size < 0) return '—';
  if (size < 1024) return `${Math.round(size)} B`;
  if (size < 1024 * 1024) {
    const kb = size / 1024;
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    const mb = size / (1024 * 1024);
    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  }
  const gb = size / (1024 * 1024 * 1024);
  return `${gb < 10 ? gb.toFixed(2) : Math.round(gb)} GB`;
}
