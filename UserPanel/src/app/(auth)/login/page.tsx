'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/LoginForm';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <p className="muted">Завантаження…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
