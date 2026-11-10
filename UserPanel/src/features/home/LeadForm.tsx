'use client';

import { FormEvent, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import type { SiteBlock } from '@/lib/blocks';

type Props = {
  block?: SiteBlock;
  title?: string;
  text?: string;
  buttonText?: string;
  category?: string;
  location?: string;
};

export function LeadForm({
  block,
  title: titleProp,
  text: textProp,
  buttonText: buttonTextProp,
  category = 'site',
  location,
}: Props) {
  const pathname = usePathname();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const plaque = block?.plaque?.trim() || 'Заявка';
  const title = block?.title?.trim() || titleProp || 'Записатись на навчання';
  const text =
    block?.meta.description?.trim() ||
    textProp ||
    'Залиште контакти — ми напишемо і підкажемо, з якого рівня почати.';
  const buttonText = block?.meta.button_label?.trim() || buttonTextProp || 'Надіслати заявку';

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk(false);
    setBusy(true);
    try {
      await api('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          email,
          category,
          location: location || pathname || '/',
        }),
      });
      setOk(true);
      setName('');
      setPhone('');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося надіслати');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-band" id="lead-form">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow-tag">{plaque}</div>
          <h2 dangerouslySetInnerHTML={{ __html: title }} />
          <p>{text}</p>
        </div>
        <form className="form-card" onSubmit={onSubmit}>
          {error ? <p className="error">{error}</p> : null}
          {ok ? <p className="ok">Заявку надіслано. Ми напишемо вам.</p> : null}
          <label htmlFor="lead-name">Імʼя</label>
          <input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          <label htmlFor="lead-phone">Телефон</label>
          <input id="lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required minLength={6} />
          <label htmlFor="lead-email">Email</label>
          <input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn full" type="submit" disabled={busy}>
            {busy ? 'Надсилання…' : buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}
