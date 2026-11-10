import type { PrismaClient } from '@prisma/client';
import { DEFAULT_MAILING_TEMPLATES, MAILING_SETTING_KEY } from '../../../settings/mailing-settings';

const LEGACY_PASSWORD_RESET_BODY =
  'Вітаємо, {{first_name}}.<br><br>Щоб змінити пароль, перейдіть за посиланням: <a href="{{reset_link}}">{{reset_link}}</a><br>Посилання дійсне {{expires_in_minutes}} хв.<br><br>Якщо це були не ви — напишіть нам: {{support_email}}';

export async function migratePasswordResetTemplate(prisma: PrismaClient) {
  const row = await prisma.setting.findUnique({ where: { key: MAILING_SETTING_KEY } });
  if (!row?.value || typeof row.value !== 'object') return;

  const value = row.value as {
    templates?: { password_reset?: { body?: string } };
  };
  const currentBody = value.templates?.password_reset?.body;
  if (currentBody !== LEGACY_PASSWORD_RESET_BODY) return;

  const next = {
    ...(row.value as Record<string, unknown>),
    templates: {
      ...(value.templates ?? {}),
      password_reset: {
        ...(value.templates?.password_reset ?? {}),
        body: DEFAULT_MAILING_TEMPLATES.password_reset.body,
      },
    },
  };

  await prisma.setting.update({
    where: { key: MAILING_SETTING_KEY },
    data: { value: next },
  });
}
