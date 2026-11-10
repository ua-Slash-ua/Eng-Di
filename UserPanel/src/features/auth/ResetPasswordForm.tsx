'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { api } from '@/lib/api';

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = useMemo(() => params?.get('token')?.trim() ?? '', [params]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setConfirmError('');
    if (!token) {
      setError('Немає посилання для відновлення. Відкрийте лист ще раз або запросіть новий лист у кабінеті.');
      return;
    }
    if (newPassword.trim().length < 8) {
      setError('Пароль має містити щонайменше 8 символів.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError('Паролі не співпадають.');
      return;
    }
    setBusy(true);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setSaved(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося змінити пароль');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Новий пароль"
      lead="Створіть новий пароль для входу в кабінет."
      footer={
        <Link href="/login">{saved ? 'Увійти з новим паролем' : 'Перейти до входу'}</Link>
      }
    >
      {error ? <p className="error">{error}</p> : null}
      {saved ? (
        <p className="ok">Пароль оновлено. Тепер можна увійти з новим паролем.</p>
      ) : (
        <form className="auth-form" onSubmit={onSubmit}>
          {!token ? (
            <p className="error">Посилання недійсне або прострочене. Запросіть новий лист у профілі кабінету.</p>
          ) : null}
          <label htmlFor="newPassword">Новий пароль</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={!token}
          />
          <p className="muted auth-hint">Мінімум 8 символів.</p>
          <label htmlFor="confirmPassword">Повторіть пароль</label>
          <input
            id="confirmPassword"
            className={confirmError ? 'is-invalid' : undefined}
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmError) setConfirmError('');
            }}
            required
            disabled={!token}
          />
          {confirmError ? <p className="error auth-field-error">{confirmError}</p> : null}
          <button className="btn full" type="submit" disabled={busy || !token}>
            {busy ? 'Збереження…' : 'Зберегти'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
