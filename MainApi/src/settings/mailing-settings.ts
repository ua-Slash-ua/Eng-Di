import { MAILING_TYPES, type MailingType } from '../mailings/mailing.types';

export const MAILING_SETTING_KEY = 'mailings';

export type MailingTemplate = {
  subject: string;
  body: string;
};

export type MailingSettings = {
  enabled: boolean;
  flags: Record<MailingType, boolean>;
  templates: Record<MailingType, MailingTemplate>;
  welcomeRegistration: boolean;
  passwordReset: boolean;
};

const DEFAULT_FLAGS: Record<MailingType, boolean> = {
  welcome_registration: true,
  password_reset: true,
  lesson_reminder: true,
  lesson_teacher_proposed: true,
  lesson_student_confirmed: true,
  lesson_student_counter: true,
  lesson_teacher_confirmed: true,
  lesson_declined: true,
  lesson_frozen_student: true,
  lesson_frozen_teacher: true,
  tariff_selected: true,
};

export const DEFAULT_MAILING_TEMPLATES: Record<MailingType, MailingTemplate> = {
  welcome_registration: {
    subject: 'Вітаємо в EngDi, {{first_name}}!',
    body: 'Дякуємо за реєстрацію, {{name}}!<br><br>Ваш email: {{email}}<br>Тимчасовий пароль: {{password}}<br><br>Увійдіть у кабінет: <a href="{{login_url}}">{{login_url}}</a><br><br>Гарного навчання!',
  },
  password_reset: {
    subject: 'Скидання паролю для акаунта EngDi',
    body:
      'Вітаємо, {{first_name}}.<br><br>Отримали запит на зміну пароля для акаунта {{email}}.<br><br>Натисніть кнопку, щоб задати новий пароль:<br><br>{{reset_button}}<br><br>Посилання дійсне {{expires_in_minutes}} хв.<br>Якщо кнопка не відкривається, скопіюйте посилання: {{reset_link}}<br><br>Якщо це були не ви — напишіть нам: {{support_email}}',
  },
  lesson_reminder: {
    subject: 'Через годину — урок №{{lesson_number}}',
    body: 'Привіт, {{first_name}}!<br><br>Нагадуємо: за годину урок №{{lesson_number}} з {{counterpart_name}}.<br>Початок: {{starts_at}}.<br><br>Кабінет: <a href="{{cabinet_url}}">{{cabinet_url}}</a>',
  },
  lesson_teacher_proposed: {
    subject: '{{teacher_name}} запропонував час для уроку №{{lesson_number}}',
    body: 'Привіт, {{first_name}}!<br><br>{{teacher_name}} пропонує провести урок №{{lesson_number}} {{starts_at}}.<br>Підтвердіть час або запропонуйте інший слот у кабінеті.<br><br><a href="{{cabinet_url}}">Відкрити заняття</a>',
  },
  lesson_student_confirmed: {
    subject: '{{student_name}} підтвердив урок №{{lesson_number}}',
    body: 'Привіт, {{first_name}}!<br><br>{{student_name}} підтвердив час уроку №{{lesson_number}}: {{starts_at}}.<br>До зустрічі на занятті!<br><br><a href="{{cabinet_url}}">Кабінет викладача</a>',
  },
  lesson_student_counter: {
    subject: '{{student_name}} запропонував інший час для уроку №{{lesson_number}}',
    body: 'Привіт, {{first_name}}!<br><br>{{student_name}} пропонує інший час для уроку №{{lesson_number}}: {{starts_at}}.<br>Підтвердіть слот або запропонуйте свій варіант.<br><br><a href="{{cabinet_url}}">Відкрити заняття</a>',
  },
  lesson_teacher_confirmed: {
    subject: 'Час уроку №{{lesson_number}} підтверджено',
    body: 'Привіт, {{first_name}}!<br><br>{{teacher_name}} підтвердив урок №{{lesson_number}} на {{starts_at}}.<br>До зустрічі на занятті!<br><br><a href="{{cabinet_url}}">Кабінет учня</a>',
  },
  lesson_declined: {
    subject: 'Пропозицію щодо уроку №{{lesson_number}} відхилено',
    body: 'Привіт, {{first_name}}!<br><br>{{actor_name}} відхилив запропонований час уроку №{{lesson_number}}.<br>Можна узгодити новий слот у кабінеті.<br><br><a href="{{cabinet_url}}">Відкрити заняття</a>',
  },
  lesson_frozen_student: {
    subject: 'Урок №{{lesson_number}} заморожено',
    body: 'Привіт, {{first_name}}!<br><br>Урок №{{lesson_number}} з {{teacher_name}} заморожено. Цей слот більше не активний.<br><br><a href="{{cabinet_url}}">Кабінет учня</a>',
  },
  lesson_frozen_teacher: {
    subject: '{{student_name}} заморозив урок №{{lesson_number}}',
    body: 'Привіт, {{first_name}}!<br><br>{{student_name}} заморозив урок №{{lesson_number}} ({{starts_at}}).<br>Слот звільнено в розкладі.<br><br><a href="{{cabinet_url}}">Кабінет викладача</a>',
  },
  tariff_selected: {
    subject: 'Дякуємо за тариф «{{tariff_title}}»',
    body: 'Привіт, {{first_name}}!<br><br>Дякуємо, що обрали тариф «{{tariff_title}}».<br>У ньому передбачено {{lessons_count}} занять. Викладач організує графік під ваш ритм навчання.<br>Початок: {{starts_on}}.<br><br><a href="{{cabinet_url}}">Перейти до занять</a>',
  },
};

export const DEFAULT_MAILING_SETTINGS: MailingSettings = {
  enabled: true,
  flags: { ...DEFAULT_FLAGS },
  templates: cloneTemplates(),
  welcomeRegistration: true,
  passwordReset: true,
};

function cloneTemplates(): Record<MailingType, MailingTemplate> {
  const templates = {} as Record<MailingType, MailingTemplate>;
  for (const type of MAILING_TYPES) {
    templates[type] = { ...DEFAULT_MAILING_TEMPLATES[type] };
  }
  return templates;
}

function normalizeTemplate(raw: unknown, fallback: MailingTemplate): MailingTemplate {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  const data = raw as Partial<MailingTemplate>;
  return {
    subject: typeof data.subject === 'string' && data.subject.trim() ? data.subject : fallback.subject,
    body: typeof data.body === 'string' && data.body.trim() ? data.body : fallback.body,
  };
}

function asBooleanMap(raw: unknown): Partial<Record<MailingType, boolean>> {
  if (!raw || typeof raw !== 'object') return {};
  const data = raw as Record<string, unknown>;
  const next: Partial<Record<MailingType, boolean>> = {};
  for (const type of MAILING_TYPES) {
    if (typeof data[type] === 'boolean') next[type] = data[type];
  }
  return next;
}

export function normalizeMailingSettings(raw: unknown): MailingSettings {
  const flags = { ...DEFAULT_FLAGS };
  const templates = cloneTemplates();
  const base: MailingSettings = {
    enabled: DEFAULT_MAILING_SETTINGS.enabled,
    flags,
    templates,
    welcomeRegistration: true,
    passwordReset: true,
  };
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<MailingSettings> & {
    flags?: unknown;
    templates?: unknown;
    welcomeRegistration?: unknown;
    passwordReset?: unknown;
  };
  if (typeof data.enabled === 'boolean') base.enabled = data.enabled;
  Object.assign(flags, asBooleanMap(data.flags));
  if (typeof data.welcomeRegistration === 'boolean') flags.welcome_registration = data.welcomeRegistration;
  if (typeof data.passwordReset === 'boolean') flags.password_reset = data.passwordReset;
  if (data.templates && typeof data.templates === 'object') {
    const source = data.templates as Partial<Record<MailingType, MailingTemplate>>;
    for (const type of MAILING_TYPES) {
      templates[type] = normalizeTemplate(source[type], DEFAULT_MAILING_TEMPLATES[type]);
    }
  }
  base.welcomeRegistration = flags.welcome_registration;
  base.passwordReset = flags.password_reset;
  return base;
}
