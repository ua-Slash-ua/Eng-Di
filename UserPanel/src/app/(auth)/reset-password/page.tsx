import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <p className="muted">Завантаження…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
