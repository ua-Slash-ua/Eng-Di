export type ParsedBounce = {
  emails: string[];
  messageIds: string[];
  action: string | null;
  dsnStatus: string | null;
  responseCode: number | null;
  diagnostic: string | null;
  permanent: boolean;
};

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export function parseBounce(raw: string, senderEmail?: string | null): ParsedBounce | null {
  const text = raw.replace(/\r\n/g, '\n');
  if (!looksLikeBounce(text)) return null;

  const action = first(text, /\bAction:\s*(failed|delayed|delivered|relayed|expanded)\b/i);
  const dsnStatus = first(text, /\bStatus:\s*([245]\.\d{1,3}\.\d{1,3})\b/i);
  const diagnostic =
    collectDiagnostic(text) ||
    first(text, /(550[\s-]+5\.1\.1[^\n]*)/i) ||
    first(text, /(Адресу не знайдено[^\n]*)/i);
  const responseCode =
    Number(first(text, /\bDiagnostic-Code:[^\n]*\b([45]\d\d)\b/i) || first(diagnostic || '', /\b([45]\d\d)\b/) || '') ||
    null;

  const emails = unique([
    ...all(text, /X-Failed-Recipients:\s*([^\n]+)/gi).flatMap((line) => line.split(/[,;\s]+/)),
    ...all(text, /Final-Recipient:\s*(?:rfc822;)?\s*([^\s;]+)/gi),
    ...all(text, /Original-Recipient:\s*(?:rfc822;)?\s*([^\s;]+)/gi),
    ...all(text, /The email account that you tried to reach does not exist[\s\S]{0,80}?([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi),
  ])
    .map(normalizeEmail)
    .filter((email) => email && !isIgnoredAddress(email, senderEmail));

  if (!emails.length) {
    emails.push(
      ...[...text.matchAll(EMAIL_RE)]
        .map((match) => normalizeEmail(match[0]))
        .filter((email) => email && !isIgnoredAddress(email, senderEmail)),
    );
  }

  const messageIds = unique([
    ...all(text, /Original-Message-ID:\s*<?([^>\s]+)>?/gi),
    ...all(text, /Message-ID:\s*<(engdi-[^>]+)>/gi),
  ]).map(normalizeMessageId);

  const permanent = action === 'failed' || Boolean(dsnStatus?.startsWith('5.')) || responseCode === 550 || emails.length > 0;
  if (action === 'delayed' || dsnStatus?.startsWith('4.')) {
    return null;
  }
  if (!emails.length && !messageIds.length) return null;

  return {
    emails: unique(emails),
    messageIds: unique(messageIds),
    action: action?.toLowerCase() ?? null,
    dsnStatus,
    responseCode,
    diagnostic: diagnostic?.replace(/\s+/g, ' ').trim() || null,
    permanent,
  };
}

export function bounceErrorPayload(bounce: ParsedBounce) {
  return {
    name: 'MailBounce',
    code: 'SMTP_BOUNCE',
    command: 'DSN',
    responseCode: bounce.responseCode ?? (bounce.permanent ? 550 : undefined),
    dsnStatus: bounce.dsnStatus ?? undefined,
    response: bounce.diagnostic ?? undefined,
    message: bounce.diagnostic || 'Delivery Status Notification (Failure)',
    action: bounce.action ?? undefined,
    emails: bounce.emails,
  };
}

export function normalizeMessageId(value: string) {
  return value.trim().replace(/^<|>$/g, '').toLowerCase();
}

function looksLikeBounce(text: string) {
  return (
    /mailer-daemon/i.test(text) ||
    /Delivery Status Notification/i.test(text) ||
    /message\/delivery-status/i.test(text) ||
    /X-Failed-Recipients:/i.test(text) ||
    /Адресу не знайдено/i.test(text) ||
    /could not be delivered/i.test(text) ||
    /550[\s-]+5\.1\.1/i.test(text)
  );
}

function collectDiagnostic(text: string) {
  const block = text.match(/Diagnostic-Code:\s*[\s\S]{0,400}/i)?.[0];
  if (!block) return null;
  return block
    .split('\n')
    .map((line) => line.replace(/^Diagnostic-Code:\s*/i, '').replace(/^\s+/, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
}

function isIgnoredAddress(email: string, senderEmail?: string | null) {
  const [local, host] = email.split('@');
  if (!local || !host) return true;
  if (senderEmail && email === normalizeEmail(senderEmail)) return true;
  if (/^(mailer-daemon|mail-daemon|postmaster)$/i.test(local)) return true;
  if (/(^|\.)(googlemail\.com|mail\.google\.com)$/i.test(host)) return true;
  if (/(^|\.)google\.com$/i.test(host)) return true;
  return false;
}

function normalizeEmail(value: string) {
  return value.trim().replace(/^<|>$/g, '').replace(/[,;]+$/, '').toLowerCase();
}

function first(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim() ?? null;
}

function all(text: string, pattern: RegExp) {
  return [...text.matchAll(pattern)].map((match) => match[1]?.trim()).filter((item): item is string => Boolean(item));
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}
