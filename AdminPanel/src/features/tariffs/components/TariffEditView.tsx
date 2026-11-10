'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconPicker } from '@/components/fields/IconPicker';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { withCopyLabel } from '@/lib/duplicate';
import { formatUah } from '@/lib/format';
import { tariffsApi } from '../api';
import {
  DURATION_OPTIONS,
  VARIANT_OPTIONS,
  durationLabel,
  paymentPartsLabel,
  type TariffItem,
} from '../types';
import { CreateTariffButton } from './CreateTariffButton';

export function TariffEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [item, setItem] = useState<TariffItem | null>(null);
  const [tab, setTab] = useState<'main' | 'billing'>('main');
  const [title, setTitle] = useState('');
  const [lessons, setLessons] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [note, setNote] = useState('');
  const [variant, setVariant] = useState('start');
  const [icon, setIcon] = useState('');
  const [popular, setPopular] = useState(false);
  const [lessonPrice, setLessonPrice] = useState('');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [durationMonths, setDurationMonths] = useState('1');
  const [frozenLessonsPerMonth, setFrozenLessonsPerMonth] = useState('0');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { dirty, markSaved } = useDirtyForm(
    { title, lessons, price, oldPrice, note, variant, icon, popular, lessonPrice, installmentCount, durationMonths, frozenLessonsPerMonth },
    Boolean(item),
  );

  useEffect(() => {
    tariffsApi
      .get(id)
      .then((tariff) => {
        setItem(tariff);
        applyTariff(tariff);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  function applyTariff(tariff: TariffItem) {
    setTitle(tariff.title);
    setLessons(String(tariff.lessons));
    setPrice(String(tariff.price));
    setOldPrice(tariff.oldPrice ? String(tariff.oldPrice) : '');
    setNote(tariff.note);
    setVariant(tariff.variant);
    setIcon(tariff.icon ?? '');
    setPopular(tariff.popular);
    setLessonPrice(
      String(tariff.lessonPrice || (tariff.lessons ? Math.round(tariff.price / tariff.lessons) : 0)),
    );
    setInstallmentCount(String(Math.max(1, tariff.installmentCount || 1)));
    setDurationMonths(String(tariff.durationMonths || 1));
    setFrozenLessonsPerMonth(String(tariff.frozenLessonsPerMonth ?? 0));
  }

  function onLessonsChange(value: string) {
    setLessons(value);
    const nextLessons = Number(value);
    const nextPrice = Number(price);
    if (nextLessons > 0 && nextPrice > 0) {
      setLessonPrice(String(Math.round(nextPrice / nextLessons)));
    }
  }

  function onPriceChange(value: string) {
    setPrice(value);
    const nextLessons = Number(lessons);
    const nextPrice = Number(value);
    if (nextLessons > 0 && nextPrice > 0) {
      setLessonPrice(String(Math.round(nextPrice / nextLessons)));
    }
  }

  function payload() {
    return {
      title,
      lessons: Number(lessons),
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      note,
      variant,
      icon,
      popular,
      lessonPrice: Number(lessonPrice) || undefined,
      installmentCount: Math.max(1, Number(installmentCount) || 1),
      durationMonths: Number(durationMonths) || 1,
      frozenLessonsPerMonth: Math.max(0, Number(frozenLessonsPerMonth) || 0),
    };
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const tariff = await tariffsApi.update(id, payload());
      setItem(tariff);
      applyTariff(tariff);
      markSaved();
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    if (!window.confirm(`Видалити «${item.title}»?`)) return;
    setError('');
    try {
      await tariffsApi.remove(item.id);
      router.replace('/tariffs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  async function onDuplicate() {
    setDuplicating(true);
    setError('');
    try {
      const created = await tariffsApi.create({
        ...payload(),
        title: withCopyLabel(title, 120),
        popular: false,
      });
      router.push(`/tariffs/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/tariffs" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  const perLesson = Number(lessonPrice) || (item.lessons ? Math.round(item.price / item.lessons) : 0);

  return (
    <>
      <PageHead
        sticky
        backHref="/tariffs"
        backLabel="До тарифів"
        title={item.title}
        description={
          <MetaBar
            items={[
              { label: 'За урок', value: perLesson ? `${formatUah(perLesson)} грн` : '—' },
              { label: 'Оплата', value: paymentPartsLabel(Number(installmentCount) || 1) },
              { label: 'Термін', value: durationLabel(Number(durationMonths) || 1) },
              { label: 'Оновлено', value: formatDateTime(item.updatedAt) },
              { label: 'Створено', value: formatDateTime(item.createdAt) },
            ]}
          />
        }
        actions={
          <>
            <CreateTariffButton hideTrigger open={createOpen} onOpenChange={setCreateOpen} />
            <button className="btn" type="submit" form="tariff-form" disabled={busy || !dirty}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <RecordActionsMenu
              createLabel="Новий тариф"
              onCreate={() => setCreateOpen(true)}
              onDuplicate={() => void onDuplicate()}
              duplicateBusy={duplicating}
              onDelete={onDelete}
            />
          </>
        }
      />

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={`tab${tab === 'main' ? ' active' : ''}`} type="button" onClick={() => setTab('main')}>
          Основна
        </button>
        <button className={`tab${tab === 'billing' ? ' active' : ''}`} type="button" onClick={() => setTab('billing')}>
          Умови
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>{tab === 'main' ? 'Тариф' : 'Умови'}</h3>
        </div>
        <form className="form-box" id="tariff-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          {tab === 'main' ? (
            <>
              <label htmlFor="title">Назва</label>
              <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={120} />
              <label htmlFor="lessons">Уроків</label>
              <input
                id="lessons"
                type="number"
                min={1}
                value={lessons}
                onChange={(e) => onLessonsChange(e.target.value)}
                required
              />
              <label htmlFor="price">Ціна, грн</label>
              <input
                id="price"
                type="number"
                min={1}
                value={price}
                onChange={(e) => onPriceChange(e.target.value)}
                required
              />
              <label htmlFor="oldPrice">Стара ціна, грн</label>
              <input
                id="oldPrice"
                type="number"
                min={0}
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                placeholder="немає знижки"
              />
              <label htmlFor="note">Підпис унизу</label>
              <input id="note" value={note} onChange={(e) => setNote(e.target.value)} required minLength={2} maxLength={180} />
              <label htmlFor="variant">Стиль картки</label>
              <Select id="variant" value={variant} onChange={setVariant} options={VARIANT_OPTIONS} />
              <IconPicker id="icon" value={icon} onChange={setIcon} />
              <label className="form-check">
                <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} /> Популярний вибір
              </label>
            </>
          ) : (
            <>
              <label htmlFor="lessonPrice">Ціна одного уроку, грн</label>
              <input
                id="lessonPrice"
                type="number"
                min={1}
                value={lessonPrice}
                onChange={(e) => setLessonPrice(e.target.value)}
                required
              />
              <p className="muted">Рахується з ціни пакета, можна виправити вручну.</p>
              <label htmlFor="installmentCount">Оплата</label>
              <input
                id="installmentCount"
                type="number"
                min={1}
                max={24}
                value={installmentCount}
                onChange={(e) => setInstallmentCount(e.target.value)}
                required
              />
              <p className="muted">1 — одразу, 2 і більше — на скільки частин можна розділити платіж.</p>
              <label htmlFor="durationMonths">Термін дії</label>
              <Select
                id="durationMonths"
                value={durationMonths}
                onChange={setDurationMonths}
                options={DURATION_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
              />
              <p className="muted">Відлік від моменту підключення, не від початку календарного місяця.</p>
              <label htmlFor="frozenLessonsPerMonth">Заморозок на місяць</label>
              <input
                id="frozenLessonsPerMonth"
                type="number"
                min={0}
                value={frozenLessonsPerMonth}
                onChange={(e) => setFrozenLessonsPerMonth(e.target.value)}
                required
              />
              <p className="muted">
                Скільки узгоджених уроків учень може пропустити за календарний місяць з поверненням коштів. 0 — без
                заморозок.
              </p>
            </>
          )}
        </form>
      </div>
    </>
  );
}
