const ALLOWED_TAGS = new Set(['span', 'br', 'strong', 'em', 'b', 'i', 'font']);
const ALLOWED_CLASSES = new Set(['script', 'u1']);

export function sanitizeRichText(input: string): string {
  const raw = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Browsers often wrap lines in <div>/<p>; keep them as line breaks.
    .replace(/\r\n|\r|\n/g, '<br>')
    .replace(/<br\s*\/?>/gi, '<br>')
    .replace(/<\/(div|p|h[1-6])>/gi, '<br>')
    .replace(/<(div|p|h[1-6])\b[^>]*>/gi, '');

  const cleaned = raw.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) {
      return '';
    }
    if (name === 'br') {
      return '<br>';
    }
    if (full.startsWith('</')) {
      if (name === 'b') {
        return '</strong>';
      }
      if (name === 'i') {
        return '</em>';
      }
      if (name === 'font') {
        return '</span>';
      }
      return `</${name === 'strong' || name === 'em' || name === 'span' ? name : name}>`;
    }
    if (name === 'b' || name === 'strong') {
      return '<strong>';
    }
    if (name === 'i' || name === 'em') {
      return '<em>';
    }
    // execCommand('foreColor') usually emits <font color="…"> — keep it as styled span.
    if (name === 'font') {
      const colorAttr = attrs.match(/\bcolor\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const color = (colorAttr?.[2] ?? colorAttr?.[3] ?? colorAttr?.[4] ?? '').trim();
      if (color && isSafeColor(color)) {
        return `<span style="color: ${color}">`;
      }
      return '<span>';
    }
    const classMatch = attrs.match(/class\s*=\s*["']([^"']*)["']/i);
    const styleMatch = attrs.match(/style\s*=\s*["']([^"']*)["']/i);
    const cls = (classMatch?.[1] ?? '')
      .split(/\s+/)
      .filter((item) => ALLOWED_CLASSES.has(item))
      .join(' ');
    const style = sanitizeStyle(styleMatch?.[1] ?? '');
    const parts = [cls ? `class="${cls}"` : '', style ? `style="${style}"` : ''].filter(Boolean);
    return `<span${parts.length ? ` ${parts.join(' ')}` : ''}>`;
  });

  return cleaned
    .replace(/(?:<br>\s*){3,}/gi, '<br><br>')
    .replace(/^(?:\s|<br>)+/gi, '')
    .replace(/(?:\s|<br>)+$/gi, '');
}

function sanitizeStyle(style: string): string {
  const allowed: string[] = [];
  for (const part of style.split(';')) {
    const colon = part.indexOf(':');
    if (colon < 0) {
      continue;
    }
    const prop = part.slice(0, colon).trim().toLowerCase();
    const value = part.slice(colon + 1).trim();
    if (!prop || !value) {
      continue;
    }
    if (prop === 'color' && isSafeColor(value)) {
      allowed.push(`color: ${value}`);
    }
    if (prop === 'font-style' && /^(italic|normal)$/i.test(value)) {
      allowed.push(`font-style: ${value}`);
    }
    if (prop === 'font-weight' && /^(bold|normal|[1-9]00)$/i.test(value)) {
      allowed.push(`font-weight: ${value}`);
    }
  }
  return allowed.join('; ');
}

function isSafeColor(value: string): boolean {
  return (
    /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ||
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(value) ||
    /^[a-z]+$/i.test(value)
  );
}
