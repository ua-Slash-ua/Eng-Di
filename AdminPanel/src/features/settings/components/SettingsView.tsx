'use client';

import { FormEvent, useEffect, useState } from 'react';
import { RepeaterField, type RepeaterFieldDef } from '@/components/fields/RepeaterField';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import {
  settingsApi,
  type BrandingSettings,
  type BrandingSettingsPayload,
  type ContactSocial,
  type ContactsSettings,
  type MediaFormatOption,
  type MediaSettings,
  type PresentationFormatOption,
  type PresentationSettings,
  type UiSettings,
} from '../api';

type SettingsTab = 'general' | 'contacts' | 'media' | 'presentations';

const EMPTY_MEDIA: MediaSettings = {
  imageFormats: [],
  videoFormats: [],
  maxImageMb: 12,
  maxVideoMb: 100,
};

const EMPTY_PRESENTATIONS: PresentationSettings = {
  formats: [],
  maxMb: 25,
};

const EMPTY_CONTACTS: ContactsSettings = {
  email: '',
  phone: '',
  socials: [],
};

const EMPTY_BRANDING: BrandingSettings = {
  logoUrl: null,
  faviconUrl: null,
};

const EMPTY_UI: UiSettings = {
  showNewBadges: true,
};

const SOCIAL_FIELDS: RepeaterFieldDef<ContactSocial>[] = [
  { key: 'label', label: 'Назва', placeholder: 'Instagram', maxLength: 40, size: 'sm' },
  { key: 'url', label: 'Посилання', placeholder: 'https://…', maxLength: 300, size: 'lg' },
];

function toggleFormat(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function FormatChecklist({
  title,
  options,
  values,
  onChange,
}: {
  title: string;
  options: MediaFormatOption[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="settings-fieldset">
      <legend>{title}</legend>
      <div className="settings-check-grid">
        {options.map((option) => {
          const id = String(option.id);
          const checked = values.includes(id);
          return (
            <label key={id} className={`settings-check${checked ? ' is-on' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggleFormat(values, id))}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>('general');
  const [media, setMedia] = useState<MediaSettings>(EMPTY_MEDIA);
  const [presentations, setPresentations] = useState<PresentationSettings>(EMPTY_PRESENTATIONS);
  const [contacts, setContacts] = useState<ContactsSettings>(EMPTY_CONTACTS);
  const [branding, setBranding] = useState<BrandingSettings>(EMPTY_BRANDING);
  const [ui, setUi] = useState<UiSettings>(EMPTY_UI);
  const [logoAccept, setLogoAccept] = useState('.png,.jpg,.jpeg,.webp,.svg,.gif');
  const [faviconAccept, setFaviconAccept] = useState('.png,.jpg,.jpeg,.webp,.svg,.ico');
  const [logoMaxMb, setLogoMaxMb] = useState(8);
  const [faviconMaxMb, setFaviconMaxMb] = useState(2);
  const [imageOptions, setImageOptions] = useState<MediaFormatOption[]>([]);
  const [videoOptions, setVideoOptions] = useState<MediaFormatOption[]>([]);
  const [presentationOptions, setPresentationOptions] = useState<PresentationFormatOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      settingsApi.getMedia(),
      settingsApi.getPresentations(),
      settingsApi.getContacts(),
      settingsApi.getBranding(),
      settingsApi.getUi(),
    ])
      .then(([mediaPayload, presentationPayload, contactsPayload, brandingPayload, uiPayload]) => {
        setMedia(mediaPayload.settings);
        setImageOptions(mediaPayload.imageFormatOptions);
        setVideoOptions(mediaPayload.videoFormatOptions);
        setPresentations(presentationPayload.settings);
        setPresentationOptions(presentationPayload.formatOptions);
        setContacts(contactsPayload.settings);
        applyBranding(brandingPayload);
        setUi(uiPayload.settings);
        setError('');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'))
      .finally(() => setLoading(false));
  }, []);

  function applyBranding(payload: BrandingSettingsPayload) {
    setBranding(payload.settings);
    setLogoAccept(payload.logoAccept);
    setFaviconAccept(payload.faviconAccept);
    setLogoMaxMb(payload.logoMaxMb);
    setFaviconMaxMb(payload.faviconMaxMb);
  }

  async function onSaveMedia(event: FormEvent) {
    event.preventDefault();
    if (!media.imageFormats.length) {
      setError('Оберіть хоча б один формат зображень');
      return;
    }
    if (!media.videoFormats.length) {
      setError('Оберіть хоча б один формат відео');
      return;
    }
    setBusy(true);
    setError('');
    setOk('');
    try {
      const payload = await settingsApi.updateMedia(media);
      setMedia(payload.settings);
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onSavePresentations(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setOk('');
    try {
      const payload = await settingsApi.updatePresentations(presentations);
      setPresentations(payload.settings);
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveContacts(event: FormEvent) {
    event.preventDefault();
    if (!contacts.email.trim()) {
      setError('Вкажіть email');
      return;
    }
    if (!contacts.phone.trim()) {
      setError('Вкажіть телефон');
      return;
    }
    setBusy(true);
    setError('');
    setOk('');
    try {
      const payload = await settingsApi.updateContacts({
        ...contacts,
        socials: contacts.socials.filter((item) => item.label.trim()),
      });
      setContacts(payload.settings);
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function runBranding(fn: () => Promise<BrandingSettingsPayload>) {
    setBusy(true);
    setError('');
    setOk('');
    try {
      applyBranding(await fn());
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onToggleShowNewBadges(next: boolean) {
    setBusy(true);
    setError('');
    setOk('');
    try {
      const payload = await settingsApi.updateUi({ showNewBadges: next });
      setUi(payload.settings);
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  const saveFormId =
    tab === 'contacts'
      ? 'contacts-settings-form'
      : tab === 'media'
        ? 'media-settings-form'
        : tab === 'presentations'
          ? 'presentations-settings-form'
          : null;

  return (
    <>
      <PageHead
        title="Налаштування"
        description="Логотип і favicon сайту, контакти та правила медіа."
        actions={
          saveFormId ? (
            <button className="btn" type="submit" form={saveFormId} disabled={busy || loading}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
          ) : null
        }
      />

      <div className="media-type-tabs" role="tablist" aria-label="Розділи налаштувань">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'general'}
          className={`media-type-tab${tab === 'general' ? ' is-active' : ''}`}
          onClick={() => {
            setTab('general');
            setOk('');
            setError('');
          }}
        >
          Загальні
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'contacts'}
          className={`media-type-tab${tab === 'contacts' ? ' is-active' : ''}`}
          onClick={() => {
            setTab('contacts');
            setOk('');
            setError('');
          }}
        >
          Контакти
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'media'}
          className={`media-type-tab${tab === 'media' ? ' is-active' : ''}`}
          onClick={() => {
            setTab('media');
            setOk('');
            setError('');
          }}
        >
          Медіа
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'presentations'}
          className={`media-type-tab${tab === 'presentations' ? ' is-active' : ''}`}
          onClick={() => {
            setTab('presentations');
            setOk('');
            setError('');
          }}
        >
          Презентації
        </button>
      </div>

      {tab === 'general' ? (
        <div className="panel">
          <div className="panel-head">
            <h3>Загальні</h3>
          </div>
          <div className="form-box">
            <FormAlerts error={error} ok={ok} />
            {loading ? <p className="muted">Завантаження…</p> : null}
            <div className="branding-grid">
              <BrandingSlot
                title="Логотип"
                hint={`Показується в шапці, футері та кабінеті. PNG, SVG, WebP, JPEG або GIF, до ${logoMaxMb} МБ.`}
                url={branding.logoUrl}
                accept={logoAccept}
                preview="logo"
                disabled={busy || loading}
                onUpload={(file) => void runBranding(() => settingsApi.uploadLogo(file))}
                onRemove={() => void runBranding(() => settingsApi.updateBranding({ logoUrl: null }))}
              />
              <BrandingSlot
                title="Favicon"
                hint={`Іконка вкладки браузера. ICO, PNG, SVG або WebP, до ${faviconMaxMb} МБ.`}
                url={branding.faviconUrl}
                accept={faviconAccept}
                preview="favicon"
                disabled={busy || loading}
                onUpload={(file) => void runBranding(() => settingsApi.uploadFavicon(file))}
                onRemove={() => void runBranding(() => settingsApi.updateBranding({ faviconUrl: null }))}
              />
            </div>
            <p className="muted storage-footnote">Файли зберігаються одразу після завантаження.</p>

            <fieldset className="settings-fieldset" style={{ marginTop: 24 }}>
              <legend>Інтерфейс кабінету</legend>
              <label className={`settings-check${ui.showNewBadges ? ' is-on' : ''}`}>
                <input
                  type="checkbox"
                  checked={ui.showNewBadges}
                  disabled={busy || loading}
                  onChange={(event) => void onToggleShowNewBadges(event.target.checked)}
                />
                <span>Показувати бейдж New біля нових пунктів меню</span>
              </label>
              <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                Якщо увімкнено — користувачі завжди бачать «New» на позначених вкладках. Якщо вимкнено —
                бейдж ніде не показується.
              </p>
            </fieldset>
          </div>
        </div>
      ) : null}

      {tab === 'contacts' ? (
        <div className="panel">
          <div className="panel-head">
            <h3>Контакти</h3>
          </div>
          <form className="form-box" id="contacts-settings-form" onSubmit={(event) => void onSaveContacts(event)}>
            <FormAlerts error={error} ok={ok} />
            {loading ? <p className="muted">Завантаження…</p> : null}

            <label htmlFor="contacts-email">Email</label>
            <input
              id="contacts-email"
              type="email"
              value={contacts.email}
              onChange={(event) => setContacts((prev) => ({ ...prev, email: event.target.value }))}
              required
              maxLength={120}
              placeholder="hello@engdi.com"
            />

            <label htmlFor="contacts-phone">Телефон</label>
            <input
              id="contacts-phone"
              value={contacts.phone}
              onChange={(event) => setContacts((prev) => ({ ...prev, phone: event.target.value }))}
              required
              maxLength={40}
              placeholder="+380 63 000 00 00"
            />

            <RepeaterField
              id="contacts-socials"
              title="Соцмережі"
              hint="Показуються у футері через «·». Можна додати кілька."
              fields={SOCIAL_FIELDS}
              items={contacts.socials}
              onChange={(socials) => setContacts((prev) => ({ ...prev, socials }))}
              createItem={() => ({ label: '', url: '' })}
              addLabel="Додати мережу"
              emptyLabel="Поки немає соцмереж — додайте першу."
              summary={(item) => item.label || 'Без назви'}
              max={12}
            />

            <p className="muted storage-footnote">Ці дані показуються в блоці «Контакти» у футері сайту.</p>
          </form>
        </div>
      ) : null}

      {tab === 'media' ? (
        <div className="panel">
          <div className="panel-head">
            <h3>Медіа</h3>
          </div>
          <form className="form-box" id="media-settings-form" onSubmit={(event) => void onSaveMedia(event)}>
            <FormAlerts error={error} ok={ok} />
            {loading ? <p className="muted">Завантаження…</p> : null}

            <FormatChecklist
              title="Дозволені формати зображень"
              options={imageOptions}
              values={media.imageFormats}
              onChange={(imageFormats) => setMedia((prev) => ({ ...prev, imageFormats }))}
            />

            <FormatChecklist
              title="Дозволені формати відео"
              options={videoOptions}
              values={media.videoFormats}
              onChange={(videoFormats) => setMedia((prev) => ({ ...prev, videoFormats }))}
            />

            <div className="settings-limits">
              <label htmlFor="max-image-mb">Макс. розмір зображення (МБ)</label>
              <input
                id="max-image-mb"
                type="number"
                min={1}
                max={200}
                value={media.maxImageMb}
                onChange={(event) =>
                  setMedia((prev) => ({ ...prev, maxImageMb: Number(event.target.value) || 1 }))
                }
              />
              <label htmlFor="max-video-mb">Макс. розмір відео (МБ)</label>
              <input
                id="max-video-mb"
                type="number"
                min={1}
                max={2048}
                value={media.maxVideoMb}
                onChange={(event) =>
                  setMedia((prev) => ({ ...prev, maxVideoMb: Number(event.target.value) || 1 }))
                }
              />
            </div>

            <p className="muted storage-footnote">
              Ці правила перевіряються при завантаженні медіа на сервері.
            </p>
          </form>
        </div>
      ) : null}

      {tab === 'presentations' ? (
        <div className="panel">
          <div className="panel-head">
            <h3>Презентації уроків</h3>
          </div>
          <form
            className="form-box"
            id="presentations-settings-form"
            onSubmit={(event) => void onSavePresentations(event)}
          >
            <FormAlerts error={error} ok={ok} />
            {loading ? <p className="muted">Завантаження…</p> : null}

            <FormatChecklist
              title="Дозволені формати презентацій"
              options={presentationOptions}
              values={presentations.formats}
              onChange={(formats) => setPresentations((prev) => ({ ...prev, formats }))}
            />

            <div className="settings-limits">
              <label htmlFor="max-presentation-mb">Макс. розмір презентації (МБ)</label>
              <input
                id="max-presentation-mb"
                type="number"
                min={1}
                max={512}
                value={presentations.maxMb}
                onChange={(event) =>
                  setPresentations((prev) => ({ ...prev, maxMb: Number(event.target.value) || 1 }))
                }
              />
            </div>

            <p className="muted storage-footnote">
              Файли завантажуються без конвертації. Ці правила застосовуються до презентацій уроків у матеріалах.
            </p>
          </form>
        </div>
      ) : null}
    </>
  );
}

function BrandingSlot({
  title,
  hint,
  url,
  accept,
  preview,
  disabled,
  onUpload,
  onRemove,
}: {
  title: string;
  hint: string;
  url: string | null;
  accept: string;
  preview: 'logo' | 'favicon';
  disabled: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <fieldset className="settings-fieldset branding-slot">
      <legend>{title}</legend>
      <div className={`branding-preview is-${preview}`}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={title} />
        ) : (
          <span className="muted">{preview === 'logo' ? 'Немає логотипа' : 'Немає favicon'}</span>
        )}
      </div>
      <p className="muted branding-hint">{hint}</p>
      <div className="branding-actions">
        <label className={`btn-outline${disabled ? ' is-disabled' : ''}`}>
          {url ? 'Замінити' : 'Завантажити'}
          <input
            type="file"
            accept={accept}
            hidden
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) onUpload(file);
            }}
          />
        </label>
        {url ? (
          <button className="btn-danger" type="button" disabled={disabled} onClick={onRemove}>
            Прибрати
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}
