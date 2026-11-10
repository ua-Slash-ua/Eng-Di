/** Append «КОПІЯ» to the primary label of a duplicated record. */
export function withCopyLabel(value: string, maxLength = 180) {
  const base = value.trim() || 'Без назви';
  if (/\sКОПІЯ$/iu.test(base)) {
    return base.slice(0, maxLength);
  }
  const next = `${base} КОПІЯ`;
  return next.slice(0, maxLength);
}

/** Unique slug for duplicated records that require uniqueness. */
export function withCopySlug(slug: string, maxLength = 120) {
  const base = (slug.trim() || 'item').replace(/-kopiya(-[a-z0-9]+)?$/i, '') || 'item';
  const stamp = Date.now().toString(36);
  return `${base}-kopiya-${stamp}`.replace(/[^a-z0-9-]/gi, '').toLowerCase().slice(0, maxLength);
}

/** Unique email for duplicated user accounts. */
export function withCopyEmail(email: string) {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0) {
    return `kopiya-${Date.now().toString(36)}@example.com`;
  }
  const local = trimmed.slice(0, at).replace(/\+kopiya-[^+]*$/i, '');
  const domain = trimmed.slice(at + 1);
  return `${local}+kopiya-${Date.now().toString(36)}@${domain}`;
}
