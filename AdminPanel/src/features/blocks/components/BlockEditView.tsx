'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmDialog, type UsageItem } from '@/components/ConfirmDialog';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { RichTitleEditor } from '@/components/RichTitleEditor';
import { FormAlerts, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { withCopyLabel } from '@/lib/duplicate';
import { blocksApi } from '../api';
import {
  asBlockType,
  BLOCK_TYPE_LABELS,
  BLOCK_TYPE_OPTIONS,
  emptyFormatCards,
  emptyLevels,
  parseFormatCards,
  parseLevels,
  parseStatIds,
  type AboutStatOption,
  type BlockItem,
  type BlockType,
  type FormatCardItem,
  type LevelItem,
  type ReviewOption,
  type RuleOption,
  type TariffOption,
} from '../types';
import { AboutBlockFields } from './AboutBlockFields';
import { CreateBlockButton } from './CreateBlockButton';
import { FormatsBlockFields } from './FormatsBlockFields';
import { HeroBlockFields } from './HeroBlockFields';
import { LevelsBlockFields } from './LevelsBlockFields';
import { PricingBlockFields } from './PricingBlockFields';
import { ReviewsBlockFields } from './ReviewsBlockFields';
import { RulesBlockFields } from './RulesBlockFields';
import { CtaBlockFields } from './CtaBlockFields';
import { LeadBlockFields } from './LeadBlockFields';

export function BlockEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [item, setItem] = useState<BlockItem | null>(null);
  const [stats, setStats] = useState<AboutStatOption[]>([]);
  const [tariffs, setTariffs] = useState<TariffOption[]>([]);
  const [rules, setRules] = useState<RuleOption[]>([]);
  const [reviews, setReviews] = useState<ReviewOption[]>([]);
  const [name, setName] = useState('');
  const [blockType, setBlockType] = useState<BlockType>('hero');
  const [plaque, setPlaque] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accentText, setAccentText] = useState('');
  const [body, setBody] = useState('');
  const [button1Label, setButton1Label] = useState('');
  const [button1Href, setButton1Href] = useState('');
  const [button2Label, setButton2Label] = useState('');
  const [button2Href, setButton2Href] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPlaceholder, setPhotoPlaceholder] = useState('');
  const [levels, setLevels] = useState<LevelItem[]>(emptyLevels);
  const [formats, setFormats] = useState<FormatCardItem[]>(emptyFormatCards);
  const [overlayCircle, setOverlayCircle] = useState('');
  const [overlayValue, setOverlayValue] = useState('');
  const [overlayLabel, setOverlayLabel] = useState('');
  const [statIds, setStatIds] = useState<number[]>([]);
  const [tariffIds, setTariffIds] = useState<number[]>([]);
  const [ruleIds, setRuleIds] = useState<number[]>([]);
  const [reviewIds, setReviewIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [usage, setUsage] = useState<UsageItem[] | undefined>(undefined);
  const [usageLoading, setUsageLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { dirty, markSaved } = useDirtyForm(
    {
      name,
      blockType,
      plaque,
      title,
      description,
      accentText,
      body,
      button1Label,
      button1Href,
      button2Label,
      button2Href,
      photoUrl,
      photoPlaceholder,
      overlayCircle,
      overlayValue,
      overlayLabel,
      statIds,
      levels,
      formats,
      tariffIds,
      ruleIds,
      reviewIds,
    },
    Boolean(item),
  );

  useEffect(() => {
    if (!id) return;
    Promise.all([
      blocksApi.get(id),
      blocksApi.statsCatalog(),
      blocksApi.tariffsCatalog(),
      blocksApi.rulesCatalog(),
      blocksApi.reviewsCatalog(),
    ])
      .then(([block, catalog, tariffCatalog, rulesCatalog, reviewsCatalog]) => {
        setItem(block);
        setStats(catalog);
        setTariffs(tariffCatalog);
        setRules(rulesCatalog);
        setReviews(reviewsCatalog);
        setName(block.name);
        setBlockType(asBlockType(block.type));
        setPlaque(block.plaque ?? '');
        setTitle(block.title ?? '');
        setDescription(block.meta.description ?? '');
        setAccentText(block.meta.accent_text ?? '');
        setBody(block.meta.body ?? '');
        setButton1Label(block.meta.button_label ?? block.meta.button1_label ?? '');
        setButton1Href(block.meta.button_href ?? block.meta.button1_href ?? '');
        setButton2Label(block.meta.button2_label ?? '');
        setButton2Href(block.meta.button2_href ?? '');
        setPhotoUrl(block.meta.photo_url ?? '');
        setPhotoPlaceholder(block.meta.photo_placeholder ?? '');
        setLevels(parseLevels(block.meta.levels));
        setFormats(parseFormatCards(block.meta.formats));
        setOverlayCircle(block.meta.overlay_circle ?? '');
        setOverlayValue(block.meta.overlay_badge_value ?? '');
        setOverlayLabel(block.meta.overlay_badge_label ?? '');
        setStatIds(parseStatIds(block.meta.stat_ids));
        setTariffIds(parseStatIds(block.meta.tariff_ids));
        setRuleIds(parseStatIds(block.meta.rule_ids));
        setReviewIds(parseStatIds(block.meta.review_ids));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const block = await blocksApi.update(id, {
        type: blockType,
        name,
        plaque,
        title,
        meta: buildMeta(),
      });
      setItem(block);
      markSaved();
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  function buildMeta(): Record<string, string> {
    if (blockType === 'about') {
      return {
        accent_text: accentText,
        body,
        photo_url: photoUrl,
        photo_placeholder: photoPlaceholder,
        stat_ids: JSON.stringify(statIds),
      };
    }
    if (blockType === 'levels') {
      return { description, levels: JSON.stringify(levels) };
    }
    if (blockType === 'formats') {
      return {
        description,
        formats: JSON.stringify(
          formats.map((card) => ({
            ...card,
            accent: Number(card.accent) || 1,
          })),
        ),
      };
    }
    if (blockType === 'pricing') {
      return {
        description,
        tariff_ids: JSON.stringify(tariffIds),
      };
    }
    if (blockType === 'rules') {
      return {
        description,
        rule_ids: JSON.stringify(ruleIds),
      };
    }
    if (blockType === 'reviews') {
      return {
        review_ids: JSON.stringify(reviewIds),
      };
    }
    if (blockType === 'cta') {
      return {
        description,
        button_label: button1Label,
        button_href: button1Href,
      };
    }
    if (blockType === 'lead') {
      return {
        description,
        button_label: button1Label,
      };
    }
    return {
      description,
      button1_label: button1Label,
      button1_href: button1Href,
      button2_label: button2Label,
      button2_href: button2Href,
      photo_url: photoUrl,
      overlay_circle: overlayCircle,
      overlay_badge_value: overlayValue,
      overlay_badge_label: overlayLabel,
      stat_ids: JSON.stringify(statIds),
    };
  }

  async function onDuplicate() {
    setDuplicating(true);
    setError('');
    try {
      const copyName = withCopyLabel(name);
      const created = await blocksApi.create({ name: copyName, type: blockType });
      await blocksApi.update(created.id, {
        type: blockType,
        name: copyName,
        plaque,
        title,
        meta: buildMeta(),
      });
      router.push(`/blocks/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  function changeType(value: string) {
    const nextType = asBlockType(value);
    if (nextType === blockType) return;
    setBlockType(nextType);
    setPlaque('');
    setTitle('');
    setDescription('');
    setAccentText('');
    setBody('');
    setButton1Label('');
    setButton1Href('');
    setButton2Label('');
    setButton2Href('');
    setPhotoUrl('');
    setPhotoPlaceholder('');
    setOverlayCircle('');
    setOverlayValue('');
    setOverlayLabel('');
    setStatIds([]);
    setLevels(emptyLevels());
    setFormats(emptyFormatCards());
    setTariffIds([]);
    setRuleIds([]);
    setReviewIds([]);
    setOk('');
  }

  function askDelete() {
    setConfirmOpen(true);
    setUsage(undefined);
    setUsageLoading(true);
    blocksApi
      .usage(id)
      .then((rows) =>
        setUsage(
          rows.map((row) => ({
            id: row.id,
            label: row.name,
            hint: BLOCK_TYPE_LABELS[row.type] || row.type,
          })),
        ),
      )
      .catch(() => setUsage([]))
      .finally(() => setUsageLoading(false));
  }

  async function onDelete() {
    if (!item) return;
    setRemoving(true);
    setError('');
    try {
      await blocksApi.remove(item.id);
      router.replace('/blocks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
      setConfirmOpen(false);
    } finally {
      setRemoving(false);
    }
  }

  if (error && !item) {
    return (
      <>
        <p className="error">{error}</p>
        <Link href="/blocks" className="btn-outline">
          До списку
        </Link>
      </>
    );
  }

  if (!item) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHead
        sticky
        backHref="/blocks"
        backLabel="До блоків"
        title={item.name}
        description={
          <MetaBar
            items={[
              { label: 'Оновлено', value: formatDateTime(item.updatedAt) },
              { label: 'Створено', value: formatDateTime(item.createdAt) },
            ]}
          />
        }
        actions={
          <>
            <CreateBlockButton hideTrigger open={createOpen} onOpenChange={setCreateOpen} />
            <button className="btn" type="submit" form="block-form" disabled={busy || !dirty}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <RecordActionsMenu
              createLabel="Новий блок"
              onCreate={() => setCreateOpen(true)}
              onDuplicate={() => void onDuplicate()}
              duplicateBusy={duplicating}
              onDelete={askDelete}
            />
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Поля блоку</h3>
        </div>
        <form className="form-box" id="block-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          <label htmlFor="name">Назва в адмінці</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={180} />
          <label htmlFor="blockType">Тип блоку</label>
          <Select id="blockType" value={blockType} onChange={changeType} options={BLOCK_TYPE_OPTIONS} />
          <label htmlFor="plaque">Плашка</label>
          <input id="plaque" value={plaque} onChange={(e) => setPlaque(e.target.value)} maxLength={80} />
          <label>Заголовок</label>
          <RichTitleEditor value={title} onChange={setTitle} />
          {blockType === 'hero' ? (
            <HeroBlockFields
              description={description}
              setDescription={setDescription}
              button1Label={button1Label}
              button1Href={button1Href}
              setButton1Label={setButton1Label}
              setButton1Href={setButton1Href}
              button2Label={button2Label}
              button2Href={button2Href}
              setButton2Label={setButton2Label}
              setButton2Href={setButton2Href}
              photoUrl={photoUrl}
              setPhotoUrl={setPhotoUrl}
              overlayCircle={overlayCircle}
              setOverlayCircle={setOverlayCircle}
              overlayValue={overlayValue}
              setOverlayValue={setOverlayValue}
              overlayLabel={overlayLabel}
              setOverlayLabel={setOverlayLabel}
              statIds={statIds}
              setStatIds={setStatIds}
              stats={stats}
            />
          ) : null}
          {blockType === 'about' ? (
            <AboutBlockFields
              accentText={accentText}
              setAccentText={setAccentText}
              body={body}
              setBody={setBody}
              photoUrl={photoUrl}
              setPhotoUrl={setPhotoUrl}
              photoPlaceholder={photoPlaceholder}
              setPhotoPlaceholder={setPhotoPlaceholder}
              statIds={statIds}
              setStatIds={setStatIds}
              stats={stats}
            />
          ) : null}
          {blockType === 'levels' ? (
            <LevelsBlockFields
              description={description}
              setDescription={setDescription}
              levels={levels}
              setLevels={setLevels}
            />
          ) : null}
          {blockType === 'formats' ? (
            <FormatsBlockFields
              description={description}
              setDescription={setDescription}
              formats={formats}
              setFormats={setFormats}
            />
          ) : null}
          {blockType === 'pricing' ? (
            <PricingBlockFields
              description={description}
              setDescription={setDescription}
              tariffIds={tariffIds}
              setTariffIds={setTariffIds}
              tariffs={tariffs}
            />
          ) : null}
          {blockType === 'rules' ? (
            <RulesBlockFields
              description={description}
              setDescription={setDescription}
              ruleIds={ruleIds}
              setRuleIds={setRuleIds}
              rules={rules}
            />
          ) : null}
          {blockType === 'reviews' ? (
            <ReviewsBlockFields reviewIds={reviewIds} setReviewIds={setReviewIds} reviews={reviews} />
          ) : null}
          {blockType === 'cta' ? (
            <CtaBlockFields
              description={description}
              setDescription={setDescription}
              buttonLabel={button1Label}
              buttonHref={button1Href}
              setButtonLabel={setButton1Label}
              setButtonHref={setButton1Href}
            />
          ) : null}
          {blockType === 'lead' ? (
            <LeadBlockFields
              description={description}
              setDescription={setDescription}
              buttonLabel={button1Label}
              setButtonLabel={setButton1Label}
            />
          ) : null}
        </form>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Видалити блок?"
        message={`Блок «${item.name}» буде видалено разом з усіма його полями. Дію не можна скасувати.`}
        usage={usage}
        usageLoading={usageLoading}
        usageEmpty="Блок ще не додано на жодну сторінку."
        busy={removing}
        onConfirm={onDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
