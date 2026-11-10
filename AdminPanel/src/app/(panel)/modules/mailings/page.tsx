import { Suspense } from 'react';
import { MailingsModuleView } from '@/features/modules/components/MailingsModuleView';

export default function MailingsModulePage() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <MailingsModuleView />
    </Suspense>
  );
}
