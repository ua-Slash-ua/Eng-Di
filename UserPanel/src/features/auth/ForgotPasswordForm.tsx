'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { api } from '@/lib/api';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося надіслати лист');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Відновлення пароля"
      lead="Введіть email — надішлемо посилання для створення нового пароля."
      footer={<Link href="/login">Повернутися до входу</Link>}
    >
      {error ? <p className="error">{error}</p> : null}
      {sent ? (
        <p className="ok">Якщо такий email існує, лист з посиланням уже надіслано. Перевірте пошту.</p>
      ) : (
        <form className="auth-form" onSubmit={onSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn full" type="submit" disabled={busy}>
            {busy ? 'Надсилання…' : 'Надіслати посилання'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
