'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function LoginForm() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося увійти');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <form className="card" onSubmit={onSubmit}>
        <div className="side-logo" style={{ border: 0, margin: 0, padding: 0 }}>
          <span className="bubble">E</span>EngDi
        </div>
        <h1 style={{ margin: '1.25vw 0 0.5556vw', fontSize: '1.9444vw' }}>Вхід адміністратора</h1>
        <p className="lead">Панель керування школою. Доступ лише для ролі admin.</p>
        {error ? <p className="error">{error}</p> : null}
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Вхід…' : 'Увійти'}
        </button>
      </form>
    </div>
  );
}
