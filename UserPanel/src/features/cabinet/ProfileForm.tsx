'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { CabinetPage } from './CabinetPage';

type ProfileTab = 'settings' | 'password';

export function ProfileForm() {
  const { user, updateProfile, changePassword, requestPasswordReset, uploadAvatar, removeAvatar } = useAuth();
  const [tab, setTab] = useState<ProfileTab>('settings');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const birthDateLocked = Boolean(user?.birthDate);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setMiddleName(user.middleName ?? '');
      setBirthDate(user.birthDate ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaved('');
    setBusy('profile');
    try {
      await updateProfile({
        firstName,
        lastName,
        middleName,
        birthDate,
        phone,
      });
      setSaved('Дані збережено.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy('');
    }
  }

  async function onChangePassword(event: FormEvent) {
    event.preventDefault();
    setError('');
    setPasswordError('');
    setSaved('');
    if (!currentPassword.trim()) {
      setPasswordError('Введіть поточний пароль.');
      return;
    }
    if (newPassword.trim().length < 8) {
      setError('Новий пароль має містити щонайменше 8 символів.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('Новий пароль має відрізнятися від поточного.');
      return;
    }
    setBusy('password');
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setSaved('Пароль змінено. Інші сесії завершено.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не вдалося змінити пароль';
      if (/поточн/i.test(message)) {
        setPasswordError(message);
      } else {
        setError(message);
      }
    } finally {
      setBusy('');
    }
  }

  async function onForgotPassword() {
    setError('');
    setPasswordError('');
    setSaved('');
    setBusy('forgot');
    try {
      const result = await requestPasswordReset();
      setSaved(`Лист надіслано на ${result.email}. Перейдіть за посиланням у пошті, щоб змінити пароль.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося надіслати лист');
    } finally {
      setBusy('');
    }
  }

  async function onUploadAvatar(file: File) {
    setError('');
    setSaved('');
    setAvatarError('');
    const maxBytes = 5 * 1024 * 1024;
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (!allowed.has(file.type)) {
      setAvatarError('Аватар: лише JPG, PNG, WebP або GIF.');
      return;
    }
    if (file.size > maxBytes) {
      setAvatarError('Файл завеликий. Максимум 5 МБ.');
      return;
    }
    setBusy('avatar');
    try {
      await uploadAvatar(file);
      setSaved('Фото профілю оновлено.');
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Не вдалося завантажити фото');
    } finally {
      setBusy('');
    }
  }

  async function onRemoveAvatar() {
    setError('');
    setSaved('');
    setAvatarError('');
    setBusy('avatar');
    try {
      await removeAvatar();
      setSaved('Фото профілю видалено.');
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Не вдалося видалити фото');
    } finally {
      setBusy('');
    }
  }

  if (!user) {
    return null;
  }

  return (
    <CabinetPage title="Профіль" lead="Редагуйте свої дані. Email змінює лише школа.">
      {error ? <p className="error">{error}</p> : null}
      {saved ? <p className="ok">{saved}</p> : null}

      <div className="cabinet-tabs" role="tablist">
        <button
          className={tab === 'settings' ? 'active' : undefined}
          type="button"
          role="tab"
          aria-selected={tab === 'settings'}
          onClick={() => {
            setTab('settings');
            setError('');
            setPasswordError('');
          }}
        >
          Налаштування
        </button>
        <button
          className={tab === 'password' ? 'active' : undefined}
          type="button"
          role="tab"
          aria-selected={tab === 'password'}
          onClick={() => {
            setTab('password');
            setError('');
            setPasswordError('');
          }}
        >
          Пароль
        </button>
      </div>

      <section className="card cabinet-form">
        {tab === 'settings' ? (
          <form className="cabinet-form-grid" onSubmit={onSubmit}>
            <div className="cab-field is-span">
              <label>Фото профілю</label>
              <div className="profile-avatar-row">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.name} className="profile-avatar-img" />
                ) : (
                  <span className="profile-avatar-fallback" aria-hidden>
                    {(user.name.trim().charAt(0).toUpperCase() || 'U')}
                  </span>
                )}
                <div className="profile-avatar-actions">
                  <label className={`profile-avatar-upload${busy ? ' is-disabled' : ''}`}>
                    {user.avatarUrl ? 'Змінити фото' : 'Завантажити фото'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                      hidden
                      disabled={Boolean(busy)}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) void onUploadAvatar(file);
                      }}
                    />
                  </label>
                  {user.avatarUrl ? (
                    <button
                      className="profile-avatar-remove"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void onRemoveAvatar()}
                    >
                      Видалити
                    </button>
                  ) : null}
                  <p className="muted profile-avatar-hint">
                    JPG, PNG, WebP або GIF. До 5 МБ.
                  </p>
                  {avatarError ? <p className="error profile-avatar-error">{avatarError}</p> : null}
                </div>
              </div>
            </div>
            <div className="cab-field is-span">
              <label htmlFor="email">Email</label>
              <input id="email" value={user.email} disabled />
            </div>
            <div className="cab-field">
              <label htmlFor="lastName">Прізвище</label>
              <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required minLength={2} />
            </div>
            <div className="cab-field">
              <label htmlFor="firstName">Імʼя</label>
              <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required minLength={2} />
            </div>
            <div className="cab-field">
              <label htmlFor="middleName">По батькові</label>
              <input id="middleName" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div className="cab-field">
              <label htmlFor="birthDate">Дата народження</label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={birthDateLocked}
              />
              {birthDateLocked ? (
                <p className="muted">Дату народження вже збережено, змінити її не можна.</p>
              ) : (
                <p className="muted">Дату народження можна вказати лише один раз.</p>
              )}
            </div>
            <div className="cab-field is-span">
              <label htmlFor="phone">Телефон</label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="cab-field is-span">
              <button className="btn" type="submit" disabled={Boolean(busy)}>
                {busy === 'profile' ? 'Збереження…' : 'Зберегти'}
              </button>
            </div>
          </form>
        ) : (
          <form className="cabinet-form-grid is-narrow" onSubmit={onChangePassword}>
            <p className="lead is-span">Після зміни пароля інші пристрої будуть розлогінені.</p>
            <div className="cab-field is-span">
              <label htmlFor="currentPassword">Поточний пароль</label>
              <input
                id="currentPassword"
                className={passwordError ? 'is-invalid' : undefined}
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                required
              />
              {passwordError ? <p className="error profile-field-error">{passwordError}</p> : null}
            </div>
            <div className="cab-field is-span">
              <label htmlFor="newPassword">Новий пароль</label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="muted">Мінімум 8 символів.</p>
            </div>
            <div className="cab-field is-span profile-password-actions">
              <button className="btn" type="submit" disabled={Boolean(busy)}>
                {busy === 'password' ? 'Збереження…' : 'Зберегти'}
              </button>
              <button
                className="btn ghost"
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void onForgotPassword()}
              >
                {busy === 'forgot' ? 'Надсилання…' : 'Забули пароль'}
              </button>
            </div>
          </form>
        )}
      </section>
    </CabinetPage>
  );
}
