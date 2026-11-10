export const MAILING_TYPES = [
  'welcome_registration',
  'password_reset',
  'lesson_reminder',
  'lesson_teacher_proposed',
  'lesson_student_confirmed',
  'lesson_student_counter',
  'lesson_teacher_confirmed',
  'lesson_declined',
  'lesson_frozen_student',
  'lesson_frozen_teacher',
  'tariff_selected',
] as const;

export type MailingType = (typeof MAILING_TYPES)[number];

export const MAILING_TYPE_LABELS: Record<MailingType, string> = {
  welcome_registration: 'Вітання після реєстрації',
  password_reset: 'Зміна / скидання паролю',
  lesson_reminder: 'Нагадування про урок за годину',
  lesson_teacher_proposed: 'Учитель запропонував час уроку',
  lesson_student_confirmed: 'Учень підтвердив час уроку',
  lesson_student_counter: 'Учень запропонував інший час',
  lesson_teacher_confirmed: 'Учитель підтвердив час уроку',
  lesson_declined: 'Пропозицію щодо уроку відхилено',
  lesson_frozen_student: 'Урок заморожено (учень)',
  lesson_frozen_teacher: 'Урок заморожено (учитель)',
  tariff_selected: 'Дякуємо за обраний тариф',
};

export const MAILING_STATUSES = ['sent', 'skipped', 'failed'] as const;

export type MailingLogStatus = (typeof MAILING_STATUSES)[number];

export const CRON_MAILING_KINDS = ['lesson_reminder'] as const;

export type CronMailingKind = (typeof CRON_MAILING_KINDS)[number];

export const CRON_MAILING_KIND_LABELS: Record<CronMailingKind, string> = {
  lesson_reminder: 'Нагадування про урок за годину',
};

export const MAILING_TASK_STATUSES = ['pending', 'claimed', 'sent', 'skipped', 'cancelled', 'failed'] as const;

export type MailingTaskStatus = (typeof MAILING_TASK_STATUSES)[number];

export const MAILING_TASK_STATUS_LABELS: Record<MailingTaskStatus, string> = {
  pending: 'Очікує',
  claimed: 'В обробці',
  sent: 'Надіслано',
  skipped: 'Пропущено',
  cancelled: 'Скасовано',
  failed: 'Помилка',
};
