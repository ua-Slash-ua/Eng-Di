const HTTP_MESSAGES: Record<number, string> = {
  400: 'Некоректний запит',
  401: 'Не авторизовано',
  403: 'Доступ заборонено',
  404: 'Не знайдено',
  408: 'Час очікування вичерпано',
  422: 'Дані відхилено',
  429: 'Забагато запитів',
  500: 'Внутрішня помилка сервера',
  502: 'Помилка шлюзу',
  503: 'Сервіс недоступний',
  504: 'Шлюз не відповів вчасно',
};

const SMTP_MESSAGES: Record<number, string> = {
  421: 'Сервіс тимчасово недоступний',
  450: 'Поштова скринька тимчасово недоступна',
  451: 'Локальна помилка на сервері відправки',
  452: 'Недостатньо місця на сервері',
  454: 'Тимчасова помилка автентифікації',
  500: 'Синтаксична помилка SMTP',
  501: 'Некоректні параметри SMTP',
  502: 'Команду SMTP не підтримано',
  503: 'Неправильна послідовність SMTP-команд',
  504: 'Параметр SMTP не підтримано',
  530: 'Потрібна автентифікація SMTP',
  535: 'Автентифікацію відхилено. Перевірте логін і пароль',
  550: 'Адресу не знайдено або сервер її відхилив',
  551: 'Користувач не на цьому сервері',
  552: 'Перевищено розмір скриньки',
  553: 'Адресу відхилено як некоректну',
  554: 'Транзакцію відхилено',
};

const NODEMAILER_MESSAGES: Record<string, string> = {
  EAUTH: 'Помилка автентифікації SMTP. Перевірте логін і пароль',
  ECONNECTION: 'Не вдалося підключитися до SMTP-сервера',
  ETIMEDOUT: 'SMTP-сервер не відповів вчасно',
  ESOCKET: 'Обрив зʼєднання з SMTP',
  EENVELOPE: 'Некоректний відправник або одержувач',
  EDNS: 'Не вдалося знайти SMTP-хост',
  EPROTOCOL: 'Помилка SMTP-протоколу',
  ESTREAM: 'Помилка передачі листа',
  SMTP_BOUNCE: 'Лист повернуто після відправки. Адреса не прийняла пошту',
};

const DSN_MESSAGES: Record<string, string> = {
  '5.1.1': 'Адресу не знайдено',
  '5.1.2': 'Домен одержувача не існує',
  '5.1.3': 'Некоректна адреса одержувача',
  '5.2.1': 'Скриньку вимкнено',
  '5.2.2': 'Скринька переповнена',
  '5.3.0': 'Помилка поштового сервера одержувача',
  '5.4.1': 'Немає відповіді від сервера одержувача',
  '5.7.1': 'Сервер відхилив лист',
};

type MailErrorShape = {
  name?: string;
  message?: string;
  code?: string;
  command?: string;
  response?: string;
  responseCode?: number;
  statusCode?: number;
  status?: number;
  errno?: string | number;
  syscall?: string;
  hostname?: string;
  port?: number;
  dsnStatus?: string;
};

export function stringifyMailError(error: unknown): string {
  if (error == null) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    const extra = error as Error & MailErrorShape;
    const dump: MailErrorShape = {
      name: extra.name,
      message: extra.message,
    };
    if (extra.code) dump.code = extra.code;
    if (extra.command) dump.command = extra.command;
    if (extra.response) dump.response = extra.response;
    if (extra.responseCode != null) dump.responseCode = extra.responseCode;
    if (extra.statusCode != null) dump.statusCode = extra.statusCode;
    if (extra.status != null) dump.status = extra.status;
    if (extra.errno != null) dump.errno = extra.errno;
    if (extra.syscall) dump.syscall = extra.syscall;
    if (extra.hostname) dump.hostname = extra.hostname;
    if (extra.port != null) dump.port = extra.port;
    if (extra.dsnStatus) dump.dsnStatus = extra.dsnStatus;
    return JSON.stringify(dump, null, 2);
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export function parseMailError(raw: string, error?: unknown): string {
  const extra = readShape(raw, error);
  const parts: string[] = [];

  const nodemailerCode = extra.code?.toUpperCase();
  if (nodemailerCode && NODEMAILER_MESSAGES[nodemailerCode]) {
    parts.push(NODEMAILER_MESSAGES[nodemailerCode]);
  }

  const smtpCode = extra.responseCode;
  if (smtpCode && SMTP_MESSAGES[smtpCode]) {
    parts.push(`${SMTP_MESSAGES[smtpCode]} (${smtpCode})`);
  }

  const dsn = extra.dsnStatus || (raw || extra.message || extra.response || '').match(/\b([245]\.\d{1,3}\.\d{1,3})\b/)?.[1];
  if (dsn && DSN_MESSAGES[dsn]) {
    parts.push(`${DSN_MESSAGES[dsn]} (${dsn})`);
  }

  const httpCode = extra.statusCode ?? extra.status;
  if (httpCode && HTTP_MESSAGES[httpCode] && httpCode !== smtpCode) {
    parts.push(`${HTTP_MESSAGES[httpCode]} (${httpCode})`);
  }

  if (!parts.length) {
    const fromText = parseCodesFromText(raw || extra.message || extra.response || '');
    parts.push(...fromText);
  }

  if (!parts.length) {
    const fallback = extra.message || extra.response || raw.trim();
    parts.push(fallback ? shortText(fallback) : 'Невідома помилка відправки');
  }

  return unique(parts).join('. ');
}

function readShape(raw: string, error?: unknown): MailErrorShape {
  const fromError = error && typeof error === 'object' ? (error as MailErrorShape) : {};
  const fromRaw = parseJsonShape(raw);
  return { ...fromRaw, ...fromError };
}

function parseJsonShape(raw: string): MailErrorShape {
  const text = raw.trim();
  if (!text.startsWith('{')) return { message: text };
  try {
    const data = JSON.parse(text) as MailErrorShape;
    return data && typeof data === 'object' ? data : { message: text };
  } catch {
    return { message: text };
  }
}

function parseCodesFromText(text: string): string[] {
  const parts: string[] = [];
  const smtp = text.match(/\b(4\d\d|5\d\d)\b/);
  if (smtp) {
    const code = Number(smtp[1]);
    if (SMTP_MESSAGES[code]) parts.push(`${SMTP_MESSAGES[code]} (${code})`);
    else if (HTTP_MESSAGES[code]) parts.push(`${HTTP_MESSAGES[code]} (${code})`);
  }
  const http = text.match(/\b(404|401|403|400|408|422|429|500|502|503|504)\b/);
  if (http) {
    const code = Number(http[1]);
    const label = HTTP_MESSAGES[code];
    if (label && !parts.some((item) => item.includes(`(${code})`))) {
      parts.push(`${label} (${code})`);
    }
  }
  const node = text.match(/\b(EAUTH|ECONNECTION|ETIMEDOUT|ESOCKET|EENVELOPE|EDNS|EPROTOCOL)\b/i);
  if (node) {
    const code = node[1].toUpperCase();
    if (NODEMAILER_MESSAGES[code]) parts.push(NODEMAILER_MESSAGES[code]);
  }
  return parts;
}

function shortText(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 280);
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}
