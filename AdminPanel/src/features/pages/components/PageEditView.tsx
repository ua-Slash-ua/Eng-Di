'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { withCopyLabel, withCopySlug } from '@/lib/duplicate';
import { pagePath } from '@/lib/format';
import { pagesApi } from '../api';
import type { BlockCatalogItem, PageItem, PageSection } from '../types';
import { CreatePageButton } from './CreatePageButton';
import { PageSectionsPanel } from './PageSectionsPanel';

export function PageEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [tab, setTab] = useState<'main' | 'seo' | 'blocks'>('main');
  const [item, setItem] = useState<PageItem | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [catalog, setCatalog] = useState<BlockCatalogItem[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [sectionsBusy, setSectionsBusy] = useState(false);
  const { dirty, markSaved } = useDirtyForm({ title, slug, seoTitle, seoDescription, seoKeywords }, Boolean(item));

  useEffect(() => {
    if (!id) return;
    Promise.all([pagesApi.get(id), pagesApi.blocksCatalog()])
      .then(([page, blocks]) => {
        setItem(page);
        setSections(page.sections ?? []);
        setCatalog(blocks);
        setTitle(page.title);
        setSlug(page.slug);
        setSeoTitle(page.seo?.title ?? '');
        setSeoDescription(page.seo?.description ?? '');
        setSeoKeywords(page.seo?.keywords ?? '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  function applyPage(page: PageItem) {
    setItem(page);
    setSections(page.sections ?? []);
    setSlug(page.slug);
    setSeoTitle(page.seo?.title ?? '');
    setSeoDescription(page.seo?.description ?? '');
    setSeoKeywords(page.seo?.keywords ?? '');
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const page = await pagesApi.update(id, {
        title,
        slug: item?.slug === '/' ? '/' : slug,
        seo: { title: seoTitle, description: seoDescription, keywords: seoKeywords },
      });
      applyPage(page);
      markSaved();
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onAttach(blockId: number) {
    setSectionsBusy(true);
    setError('');
    try {
      const page = await pagesApi.attachSection(id, blockId);
      applyPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося додати блок');
    } finally {
      setSectionsBusy(false);
    }
  }

  async function onReorder(sectionIds: number[]) {
    setSectionsBusy(true);
    setError('');
    try {
      const page = await pagesApi.reorderSections(id, sectionIds);
      applyPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося змінити порядок');
    } finally {
      setSectionsBusy(false);
    }
  }

  async function onDetach(sectionId: number) {
    setSectionsBusy(true);
    setError('');
    try {
      const page = await pagesApi.detachSection(sectionId);
      applyPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося прибрати блок');
    } finally {
      setSectionsBusy(false);
    }
  }

  async function onDelete() {
    if (!item || item.slug === '/') return;
    if (!window.confirm(`Видалити сторінку «${item.title}»?`)) return;
    setError('');
    try {
      await pagesApi.remove(item.id);
      router.replace('/pages');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  async function onDuplicate() {
    setDuplicating(true);
    setError('');
    try {
      const nextTitle = withCopyLabel(title);
      const nextSlug = withCopySlug(slug.trim() === '/' ? 'home' : slug);
      const created = await pagesApi.create({ title: nextTitle, slug: nextSlug });
      await pagesApi.update(created.id, {
        title: nextTitle,
        slug: nextSlug,
        seo: { title: seoTitle, description: seoDescription, keywords: seoKeywords },
      });
      for (const section of sections) {
        await pagesApi.attachSection(created.id, section.block.id);
      }
      router.push(`/pages/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/pages" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  const lockedSlug = item.slug === '/';
  const seoFilled = Boolean(seoTitle && seoDescription);

  return (
    <>
      <PageHead
        sticky
        backHref="/pages"
        backLabel="До сторінок"
        title={item.title}
        description={
          <MetaBar
            items={[
              { label: 'Адреса', value: pagePath(item.slug) },
              { label: 'Блоків', value: String(sections.length) },
              { label: 'SEO', value: seoFilled ? 'заповнено' : 'неповне' },
              { label: 'Створено', value: formatDateTime(item.createdAt) },
            ]}
          />
        }
        actions={
          <>
            <CreatePageButton hideTrigger open={createOpen} onOpenChange={setCreateOpen} />
            {tab === 'blocks' ? null : (
              <button className="btn" type="submit" form="page-form" disabled={busy || !dirty}>
                {busy ? 'Збереження…' : 'Зберегти'}
              </button>
            )}
            <RecordActionsMenu
              createLabel="Нова сторінка"
              onCreate={() => setCreateOpen(true)}
              onDuplicate={() => void onDuplicate()}
              duplicateBusy={duplicating}
              onDelete={lockedSlug ? undefined : onDelete}
            />
          </>
        }
      />

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={`tab${tab === 'main' ? ' active' : ''}`} type="button" onClick={() => setTab('main')}>
          Основна
        </button>
        <button className={`tab${tab === 'blocks' ? ' active' : ''}`} type="button" onClick={() => setTab('blocks')}>
          Блоки
        </button>
        <button className={`tab${tab === 'seo' ? ' active' : ''}`} type="button" onClick={() => setTab('seo')}>
          SEO
        </button>
      </div>

      {tab === 'blocks' ? (
        <>
          <FormAlerts error={error} ok={ok} />
          <PageSectionsPanel
            sections={sections}
            catalog={catalog}
            busy={sectionsBusy}
            onAttach={onAttach}
            onReorder={onReorder}
            onDetach={onDetach}
          />
        </>
      ) : (
        <form id="page-form" onSubmit={onSave}>
          <div className="panel">
            <div className="panel-head">
              <h3>{tab === 'main' ? 'Сторінка' : 'SEO'}</h3>
            </div>
            <div className="form-box">
              <FormAlerts error={error} ok={ok} />
              {tab === 'main' ? (
                <>
                  <label htmlFor="title">Назва</label>
                  <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  <label htmlFor="slug">Slug</label>
                  <input
                    id="slug"
                    className="mono"
                    value={lockedSlug ? '/' : slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    disabled={lockedSlug}
                    required={!lockedSlug}
                    pattern="[a-z0-9-]+"
                  />
                  {lockedSlug ? <p className="muted">Головна сторінка відкривається як /</p> : null}
                </>
              ) : (
                <>
                  <label htmlFor="seoTitle">
                    SEO title <span className={`char-count${seoTitle.length > 60 ? ' is-long' : ''}`}>{seoTitle.length}/60</span>
                  </label>
                  <input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={180} />
                  <label htmlFor="seoDescription">
                    SEO description{' '}
                    <span className={`char-count${seoDescription.length > 160 ? ' is-long' : ''}`}>{seoDescription.length}/160</span>
                  </label>
                  <textarea
                    id="seoDescription"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    maxLength={320}
                    rows={4}
                  />
                  <label htmlFor="seoKeywords">Keywords</label>
                  <input
                    id="seoKeywords"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="англійська, курси, EngDi"
                    maxLength={320}
                  />
                </>
              )}
            </div>
          </div>

          {tab === 'seo' ? (
            <div className="panel" style={{ marginTop: 20 }}>
              <div className="panel-head">
                <h3>Перегляд у пошуку</h3>
              </div>
              <div className="form-box">
                <div className="serp">
                  <div className="serp-url">engdi.local{pagePath(slug)}</div>
                  <div className="serp-title">{seoTitle || title || 'Заголовок сторінки'}</div>
                  <div className="serp-desc">{seoDescription || 'Опис для пошуковика зʼявиться тут.'}</div>
                </div>
              </div>
            </div>
          ) : null}
        </form>
      )}
    </>
  );
}
