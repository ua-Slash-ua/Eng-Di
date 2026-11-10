'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/lib/auth';
import { cabinetBasePath, canAccessUserPanel } from '@/lib/roles';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export function LoginForm() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams?.get('next') ?? null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && canAccessUserPanel(user)) {
      router.replace(nextPath ?? cabinetBasePath(user.userRole));
    }
  }, [loading, user, router, nextPath]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const next = await login(email, password);
      router.replace(nextPath ?? cabinetBasePath(next.userRole));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося увійти');
    } finally {
      setBusy(false);
    }
  }

  if (loading || canAccessUserPanel(user)) {
    return (
      <div className="auth-page">
        <p className="muted">Завантаження…</p>
      </div>
    );
  }

  return (
    <AuthShell
      title="Увійти до кабінету"
      lead="Публічної реєстрації немає. Акаунт створює школа."
      footer={<Link href="/forgot-password">Забули пароль?</Link>}
    >
      {error ? <p className="error">{error}</p> : null}
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
        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn full" type="submit" disabled={busy}>
          {busy ? 'Вхід…' : 'Увійти'}
        </button>
      </form>
    </AuthShell>
  );
}
