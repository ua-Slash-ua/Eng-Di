'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { RichTitleEditor } from '@/components/RichTitleEditor';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { mailingsApi, type MailingType } from '../api';
import { MailingsLogsTable } from './MailingsLogsTable';
import { MailingsAnalytics } from './MailingsAnalytics';
import { MailingsCronView } from './MailingsCronView';

type MailingFlags = {
  enabled: boolean;
  flags: Record<MailingType, boolean>;
};

type MailingsTab = 'main' | 'about' | 'cron' | 'text-settings' | 'mailing-settings';

const TAB_LABELS: Record<MailingsTab, string> = {
  main: 'Основна',
  about: 'Інформація про розсилки',
  cron: 'Cron-дії',
  'text-settings': 'Тексти розсилок',
  'mailing-settings': 'Налаштування розсилок',
};

type MailingItem = {
  id: MailingType;
  name: string;
  short: string;
  description: string;
  toggleNote: string;
  variables: Array<{ token: string; label: string; note: string }>;
  defaultSubject: string;
  defaultBody: string;
};

const PERSON_VARS: MailingItem['variables'] = [
  { token: '{{name}}', label: 'Повне імʼя', note: 'Одержувач листа.' },
  { token: '{{first_name}}', label: 'Імʼя', note: 'Імʼя одержувача.' },
];

const LESSON_VARS: MailingItem['variables'] = [
  ...PERSON_VARS,
  { token: '{{lesson_number}}', label: 'Номер уроку', note: 'Порядковий номер заняття в тарифі.' },
  { token: '{{teacher_name}}', label: 'Викладач', note: 'Імʼя вчителя.' },
  { token: '{{student_name}}', label: 'Учень', note: 'Імʼя учня.' },
  { token: '{{starts_at}}', label: 'Дата і час', note: 'Слот уроку, наприклад: 18 серпня, 15:00.' },
  { token: '{{cabinet_url}}', label: 'Посилання в кабінет', note: 'Сторінка занять учня або вчителя.' },
];

const MAILINGS: MailingItem[] = [
  {
    id: 'welcome_registration',
    name: 'Вітання після реєстрації',
    short: 'Подяка за реєстрацію + дані для входу.',
    description: 'Автоматичний лист після створення акаунта з адмінки: імʼя, email і тимчасовий пароль.',
    toggleNote: 'Надсилати лист після створення акаунта',
    variables: [
      ...PERSON_VARS,
      { token: '{{last_name}}', label: 'Прізвище', note: 'Прізвище користувача.' },
      { token: '{{middle_name}}', label: 'По батькові', note: 'По батькові користувача.' },
      { token: '{{login_url}}', label: 'Посилання на вхід', note: 'URL сторінки входу до кабінету.' },
      { token: '{{email}}', label: 'Email', note: 'Адреса акаунта.' },
      { token: '{{password}}', label: 'Пароль', note: 'Тимчасовий пароль.' },
    ],
    defaultSubject: 'Вітаємо в EngDi, {{first_name}}!',
    defaultBody:
      'Дякуємо за реєстрацію, {{name}}!<br><br>Ваш email: {{email}}<br>Тимчасовий пароль: {{password}}<br><br>Увійдіть у кабінет: <a href="{{login_url}}">{{login_url}}</a><br><br>Гарного навчання!',
  },
  {
    id: 'password_reset',
    name: 'Зміна / скидання паролю',
    short: 'Лист для безпечного скидання паролю.',
    description: 'Системна розсилка при запиті на скидання паролю з посиланням і терміном дії.',
    toggleNote: 'Надсилати лист із посиланням на скидання',
    variables: [
      ...PERSON_VARS,
      { token: '{{email}}', label: 'Email', note: 'Адреса акаунта, для якого скидають пароль.' },
      { token: '{{reset_link}}', label: 'Посилання на скидання', note: 'Одноразове посилання (текстом).' },
      { token: '{{reset_button}}', label: 'Кнопка скидання', note: 'Готова HTML-кнопка з посиланням.' },
      { token: '{{expires_in_minutes}}', label: 'Час дії, хв', note: 'Скільки хвилин активне посилання.' },
      { token: '{{support_email}}', label: 'Пошта підтримки', note: 'Контактна пошта.' },
    ],
    defaultSubject: 'Скидання паролю для акаунта EngDi',
    defaultBody:
      'Вітаємо, {{first_name}}.<br><br>Отримали запит на зміну пароля для акаунта {{email}}.<br><br>Натисніть кнопку, щоб задати новий пароль:<br><br>{{reset_button}}<br><br>Посилання дійсне {{expires_in_minutes}} хв.<br>Якщо кнопка не відкривається, скопіюйте посилання: {{reset_link}}<br><br>Якщо це були не ви — напишіть нам: {{support_email}}',
  },
  {
    id: 'lesson_reminder',
    name: 'Нагадування про урок за годину',
    short: 'Cron: лист за годину до підтвердженого уроку.',
    description:
      'Нагадування учню і вчителю за годину до заняття. Текст підставляє номер уроку, співрозмовника і час.',
    toggleNote: 'Надсилати нагадування за годину до уроку',
    variables: [
      ...LESSON_VARS,
      { token: '{{counterpart_name}}', label: 'Співрозмовник', note: 'Для учня — вчитель, для вчителя — учень.' },
    ],
    defaultSubject: 'Через годину — урок №{{lesson_number}}',
    defaultBody:
      'Привіт, {{first_name}}!<br><br>Нагадуємо: за годину урок №{{lesson_number}} з {{counterpart_name}}.<br>Початок: {{starts_at}}.<br><br>Кабінет: <a href="{{cabinet_url}}">{{cabinet_url}}</a>',
  },
  {
    id: 'lesson_teacher_proposed',
    name: 'Учитель запропонував час',
    short: 'Учень має підтвердити слот.',
    description: 'Лист учню, коли вчитель запропонував час уроку. Просить підтвердити або запропонувати інший слот.',
    toggleNote: 'Надсилати учню після пропозиції вчителя',
    variables: LESSON_VARS,
    defaultSubject: '{{teacher_name}} запропонував час для уроку №{{lesson_number}}',
    defaultBody:
      'Привіт, {{first_name}}!<br><br>{{teacher_name}} пропонує провести урок №{{lesson_number}} {{starts_at}}.<br>Підтвердіть час або запропонуйте інший слот у кабінеті.<br><br><a href="{{cabinet_url}}">Відкрити заняття</a>',
  },
  {
    id: 'lesson_student_confirmed',
    name: 'Учень підтвердив час',
    short: 'Лист учителю після підтвердження.',
    description: 'Лист учителю, коли учень підтвердив запропонований час уроку.',
    toggleNote: 'Надсилати вчителю, коли учень підтвердив час',
    variables: LESSON_VARS,
    defaultSubject: '{{student_name}} підтвердив урок №{{lesson_number}}',
    defaultBody:
      'Привіт, {{first_name}}!<br><br>{{student_name}} підтвердив час уроку №{{lesson_number}}: {{starts_at}}.<br>До зустрічі на занятті!<br><br><a href="{{cabinet_url}}">Кабінет викладача</a>',
  },
  {
    id: 'lesson_student_counter',
    name: 'Учень запропонував інший час',
    short: 'Лист учителю з новим слотом.',
    description: 'Лист учителю, коли учень не підтвердив слот, а запропонував інший час.',
    toggleNote: 'Надсилати вчителю після зустрічної пропозиції учня',
    variables: LESSON_VARS,
    defaultSubject: '{{student_name}} запропонував інший час для уроку №{{lesson_number}}',
    defaultBody:
      'Привіт, {{first_name}}!<br><br>{{student_name}} пропонує інший час для уроку №{{lesson_number}}: {{starts_at}}.<br>Підтвердіть слот або запропонуйте свій варіант.<br><br><a href="{{cabinet_url}}">Відкрити заняття</a>',
  },
  {
    id: 'lesson_teacher_confirmed',
    name: 'Учитель підтвердив час',
    short: 'Лист учню після підтвердження вчителем.',
    description: 'Лист учню, коли вчитель підтвердив зустрічну пропозицію часу.',
    toggleNote: 'Надсилати учню, коли вчитель підтвердив час',
    variables: LESSON_VARS,
    defaultSubject: 'Час уроку №{{lesson_number}} підтверджено',
    defaultBody:
      'Привіт, {{first_name}}!<br><br>{{teacher_name}} підтвердив урок №{{lesson_number}} на {{starts_at}}.<br>До зустрічі на занятті!<br><br><a href="{{cabinet_url}}">Кабінет учня</a>',
  },
  {
    id: 'lesson_declined',
    name: 'Пропозицію відхилено',
    short: 'Лист іншій стороні після відхилення.',
    description: 'Лист учню або вчителю, якщо інша сторона відхилила запропонований час.',
    toggleNote: 'Надсилати, коли пропозицію часу відхилено',
    variables: [
      ...LESSON_VARS,
      { token: '{{actor_name}}', label: 'Хто відхилив', note: 'Імʼя учня або вчителя, який натиснув «Відхилити».' },
    ],
    defaultSubject: 'Пропозицію щодо уроку №{{lesson_number}} відхилено',
    defaultBody:
      'Привіт, {{first_name}}!<br><br>{{actor_name}} відхилив запропонований час уроку №{{lesson_number}}.<br>Можна узгодити новий слот у кабінеті.<br><br><a href="{{cabinet_url}}">Відкрити заняття</a>',
  },
  {
    id: 'lesson_frozen_student',
    name: 'Урок заморожено (учень)',
    short: 'Підтвердження учню про заморозку.',
    description: 'Лист учню після заморозки узгодженого уроку.',
    toggleNote: 'Надсилати учню після заморозки уроку',
    variables: LESSON_VARS,
    defaultSubject: 'Урок №{{lesson_number}} заморожено',
    defaultBody:
      'Привіт, {{first_name}}!<br><br>Урок №{{lesson_number}} з {{teacher_name}} заморожено. Цей слот більше не активний.<br><br><a href="{{cabinet_url}}">Кабінет учня</a>',
  },
  {
    id: 'lesson_frozen_teacher',
    name: 'Урок заморожено (учитель)',
    short: 'Повідомлення вчителю про заморозку.',
    description: 'Лист учителю, коли учень заморозив узгоджений урок.',
    toggleNote: 'Надсилати вчителю, коли учень заморозив урок',
    variables: LESSON_VARS,
    defaultSubject: '{{student_name}} заморозив урок №{{lesson_number}}',
    defaultBody:
      'Привіт, {{first_name}}!<br><br>{{student_name}} заморозив урок №{{lesson_number}} ({{starts_at}}).<br>Слот звільнено в розкладі.<br><br><a href="{{cabinet_url}}">Кабінет викладача</a>',
  },
  {
    id: 'tariff_selected',
    name: 'Дякуємо за обраний тариф',
    short: 'Лист учню після вибору тарифу.',
    description:
      'Лист учню після вибору тарифу: кількість занять у пакеті та що викладач організує графік.',
    toggleNote: 'Надсилати учню після вибору тарифу',
    variables: [
      ...PERSON_VARS,
      { token: '{{tariff_title}}', label: 'Назва тарифу', note: 'Обраний тариф.' },
      { token: '{{lessons_count}}', label: 'Кількість уроків', note: 'Скільки занять у тарифі.' },
      { token: '{{starts_on}}', label: 'Дата старту', note: 'Коли тариф стає активним.' },
      { token: '{{cabinet_url}}', label: 'Посилання в кабінет', note: 'Сторінка занять учня.' },
    ],
    defaultSubject: 'Дякуємо за тариф «{{tariff_title}}»',
    defaultBody:
      'Привіт, {{first_name}}!<br><br>Дякуємо, що обрали тариф «{{tariff_title}}».<br>У ньому передбачено {{lessons_count}} занять. Викладач організує графік під ваш ритм навчання.<br>Початок: {{starts_on}}.<br><br><a href="{{cabinet_url}}">Перейти до занять</a>',
  },
];

function defaultFlags(): Record<MailingType, boolean> {
  return Object.fromEntries(MAILINGS.map((item) => [item.id, true])) as Record<MailingType, boolean>;
}

function defaultTemplates(): Record<MailingType, { subject: string; body: string }> {
  return Object.fromEntries(
    MAILINGS.map((item) => [item.id, { subject: item.defaultSubject, body: item.defaultBody }]),
  ) as Record<MailingType, { subject: string; body: string }>;
}

const EMPTY_FLAGS: MailingFlags = {
  enabled: true,
  flags: defaultFlags(),
};

export function MailingsModuleView() {
  const [tab, setTab] = useState<MailingsTab>('main');
  const [selectedMailingId, setSelectedMailingId] = useState<MailingItem['id']>(MAILINGS[0].id);
  const [mailingSettings, setMailingSettings] = useState<MailingFlags>(EMPTY_FLAGS);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [textsBusy, setTextsBusy] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsOk, setSettingsOk] = useState('');
  const [textsError, setTextsError] = useState('');
  const [textsOk, setTextsOk] = useState('');
  const [varsOpen, setVarsOpen] = useState(false);
  const [templates, setTemplates] = useState<Record<MailingType, { subject: string; body: string }>>(defaultTemplates);
  const [mailingQuery, setMailingQuery] = useState('');

  const selected = MAILINGS.find((item) => item.id === selectedMailingId) || MAILINGS[0];
  const selectedTemplate = templates[selected.id];
  const showMailingSidebar = tab === 'text-settings';
  const mailingMatches = useMemo(() => {
    const q = mailingQuery.trim().toLowerCase();
    if (!q) return MAILINGS;
    return MAILINGS.filter((item) =>
      [item.name, item.short, item.description, item.id].some((value) => value.toLowerCase().includes(q)),
    );
  }, [mailingQuery]);

  useEffect(() => {
    mailingsApi
      .getSettings()
      .then((payload) => {
        const flags = { ...defaultFlags(), ...(payload.settings.flags ?? {}) };
        if (typeof payload.settings.welcomeRegistration === 'boolean') {
          flags.welcome_registration = payload.settings.welcomeRegistration;
        }
        if (typeof payload.settings.passwordReset === 'boolean') {
          flags.password_reset = payload.settings.passwordReset;
        }
        setMailingSettings({
          enabled: payload.settings.enabled,
          flags,
        });
        const nextTemplates = payload.settings.templates;
        if (nextTemplates) {
          setTemplates({ ...defaultTemplates(), ...nextTemplates });
        }
      })
      .catch((err: unknown) =>
        setSettingsError(err instanceof Error ? err.message : 'Не вдалося завантажити налаштування'),
      );
  }, []);

  async function saveMailingSettings(next: MailingFlags) {
    setSettingsError('');
    setSettingsOk('');
    setSettingsBusy(true);
    setMailingSettings(next);
    try {
      const payload = await mailingsApi.updateSettings({
        enabled: next.enabled,
        flags: next.flags,
      });
      setMailingSettings({
        enabled: payload.settings.enabled,
        flags: { ...defaultFlags(), ...(payload.settings.flags ?? {}) },
      });
      setSettingsOk('Збережено');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setSettingsBusy(false);
    }
  }

  async function saveTemplates() {
    setTextsError('');
    setTextsOk('');
    setTextsBusy(true);
    try {
      const payload = await mailingsApi.updateSettings({ templates });
      if (payload.settings.templates) {
        setTemplates({ ...defaultTemplates(), ...payload.settings.templates });
      }
      setTextsOk('Тексти збережено');
    } catch (err) {
      setTextsError(err instanceof Error ? err.message : 'Не вдалося зберегти тексти');
    } finally {
      setTextsBusy(false);
    }
  }

  function updateTemplate(field: 'subject' | 'body', value: string) {
    setTemplates((current) => ({
      ...current,
      [selected.id]: {
        ...current[selected.id],
        [field]: value,
      },
    }));
  }

  return (
    <>
      <PageHead
        title="Модуль «Розсилки»"
        description="Аналітика відправок, журнал листів, cron-нагадування і шаблони."
      />

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={`tab${tab === 'main' ? ' active' : ''}`} type="button" onClick={() => setTab('main')}>
          {TAB_LABELS.main}
        </button>
        <button className={`tab${tab === 'about' ? ' active' : ''}`} type="button" onClick={() => setTab('about')}>
          {TAB_LABELS.about}
        </button>
        <button className={`tab${tab === 'cron' ? ' active' : ''}`} type="button" onClick={() => setTab('cron')}>
          {TAB_LABELS.cron}
        </button>
        <button
          className={`tab${tab === 'text-settings' ? ' active' : ''}`}
          type="button"
          onClick={() => setTab('text-settings')}
        >
          {TAB_LABELS['text-settings']}
        </button>
        <button
          className={`tab${tab === 'mailing-settings' ? ' active' : ''}`}
          type="button"
          onClick={() => setTab('mailing-settings')}
        >
          {TAB_LABELS['mailing-settings']}
        </button>
      </div>

      {tab === 'main' ? (
        <MailingsAnalytics />
      ) : (
      <section className="panel mailings-panel">
        <div className="panel-head">
          <h3>{TAB_LABELS[tab]}</h3>
        </div>
        <div className={`mailings-layout${showMailingSidebar ? '' : ' is-single'}`}>
          {showMailingSidebar ? (
            <aside className="mailings-side">
              <div className="mailings-side-head">
                <p className="mailings-side-title">Список розсилок</p>
                <span className="mailings-side-count">
                  {mailingQuery.trim() ? `${mailingMatches.length} з ${MAILINGS.length}` : MAILINGS.length}
                </span>
              </div>
              <label className="mailings-side-search">
                <input
                  type="search"
                  value={mailingQuery}
                  onChange={(event) => setMailingQuery(event.target.value)}
                  placeholder="Пошук розсилки…"
                  autoComplete="off"
                  aria-label="Пошук розсилок"
                />
              </label>
              <div className="mailings-side-list">
                {mailingMatches.length ? (
                  mailingMatches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`mailing-side-link${selected.id === item.id ? ' active' : ''}`}
                      onClick={() => setSelectedMailingId(item.id)}
                    >
                      <b>{item.name}</b>
                      <span>{item.short}</span>
                    </button>
                  ))
                ) : (
                  <p className="mailings-side-empty">Нічого не знайдено</p>
                )}
              </div>
            </aside>
          ) : null}

          <div className="form-box mailings-main">
            {tab === 'about' ? (
              <Suspense fallback={<p className="muted">Завантаження логів…</p>}>
                <MailingsLogsTable />
              </Suspense>
            ) : null}

            {tab === 'cron' ? (
              <Suspense fallback={<p className="muted">Завантаження cron-дій…</p>}>
                <MailingsCronView />
              </Suspense>
            ) : null}

            {tab === 'text-settings' ? (
              <>
                <div className="mailings-text-head">
                  <h4>Тексти для: {selected.name}</h4>
                  <button className="btn-outline" type="button" onClick={() => setVarsOpen(true)}>
                    <CircleHelp size={16} />
                    Поля шаблону
                  </button>
                </div>
                <FormAlerts error={textsError} ok={textsOk} />
                <label>Тема листа</label>
                <RichTitleEditor
                  value={selectedTemplate.subject}
                  onChange={(value) => updateTemplate('subject', value)}
                  placeholder="Введіть тему листа…"
                  ariaLabel="Тема розсилки"
                  hint="Підтримує форматування. Можна вставляти змінні праворуч у тулбарі."
                  variables={selected.variables.map((item) => ({ token: item.token, label: item.token }))}
                  compact
                />
                <label style={{ marginTop: 14 }}>Текст листа</label>
                <RichTitleEditor
                  value={selectedTemplate.body}
                  onChange={(value) => updateTemplate('body', value)}
                  placeholder="Введіть текст листа…"
                  ariaLabel="Текст розсилки"
                  hint="Використовуйте {{...}} змінні для персоналізації."
                  variables={selected.variables.map((item) => ({ token: item.token, label: item.token }))}
                  compact
                />
                <div className="mailings-text-actions">
                  <button className="btn" type="button" disabled={textsBusy} onClick={() => void saveTemplates()}>
                    {textsBusy ? 'Збереження…' : 'Зберегти тексти'}
                  </button>
                </div>
              </>
            ) : null}

            {tab === 'mailing-settings' ? (
              <>
                <h4>Які розсилки надсилати</h4>
                <p className="muted">Перший пункт вмикає модуль загалом. Далі — кожна розсилка окремо.</p>
                <FormAlerts error={settingsError} ok={settingsOk} />
                <ul className="mailing-toggle-list">
                  <li>
                    <label className={`mailing-toggle${mailingSettings.enabled ? ' is-on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={mailingSettings.enabled}
                        disabled={settingsBusy}
                        onChange={(event) =>
                          void saveMailingSettings({ ...mailingSettings, enabled: event.target.checked })
                        }
                      />
                      <span>
                        <b>Розсилки</b>
                        <em>Увімкнути надсилання листів</em>
                      </span>
                    </label>
                  </li>
                  {MAILINGS.map((item) => (
                    <li key={item.id}>
                      <label
                        className={`mailing-toggle${mailingSettings.flags[item.id] ? ' is-on' : ''}${
                          mailingSettings.enabled ? '' : ' is-disabled'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(mailingSettings.flags[item.id])}
                          disabled={settingsBusy || !mailingSettings.enabled}
                          onChange={(event) =>
                            void saveMailingSettings({
                              ...mailingSettings,
                              flags: { ...mailingSettings.flags, [item.id]: event.target.checked },
                            })
                          }
                        />
                        <span>
                          <b>{item.name}</b>
                          <em>{item.toggleNote}</em>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </section>
      )}
      <Modal title={`Поля: ${selected.name}`} open={varsOpen} onClose={() => setVarsOpen(false)} size="lg">
        <div className="form-box">
          <p className="muted">Ці змінні підставляються в тему і текст листа.</p>
          <ul className="mailing-vars-list">
            {selected.variables.map((row) => (
              <li key={row.token}>
                <code>{row.token}</code>
                <b>{row.label}</b>
                <span className="muted">{row.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}
