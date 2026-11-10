'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { useAuth } from '@/lib/auth';
import { formatUserAccess } from '@/lib/permissions';
import { withCopyEmail, withCopyLabel } from '@/lib/duplicate';
import { authAdminApi, usersApi } from '../api';
import { accessRolesApi } from '@/features/access-roles/api';
import {
  ADMIN_ACCESS_OPTIONS,
  EVENT_TYPE_LABELS,
  USER_ROLE_LABELS,
  USER_ROLE_OPTIONS,
  mailingNotSentWarning,
  type User,
  type UserAuthResponse,
  type UserPanelRole,
  type UserTariffRecord,
  type UserTariffsResponse,
  type UserLessonsResponse,
  type AdminLesson,
} from '../types';
import { formatUah } from '@/lib/format';
import { durationLabel, paymentPartsLabel } from '@/features/tariffs/types';
import { CreateUserButton } from './CreateUserButton';
import { UserClassPanel } from './UserClassPanel';
import { UserMaterialsPanel } from './UserMaterialsPanel';

function adminAccessValue(user: User) {
  if (user.isSuperAdmin) return 'super_admin';
  if (user.adminRole) return 'admin_role';
  return '';
}

function freezeSlotLabel(row: AdminLesson) {
  if (!row.startDate || row.startHour == null) return '';
  const [year, month, day] = row.startDate.split('-').map(Number);
  const date = new Date(year, month - 1, day).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
  });
  return `${date}, ${String(row.startHour).padStart(2, '0')}:00`;
}

function lessonHasStarted(row: AdminLesson) {
  if (!row.startDate || row.startHour == null) return false;
  const [year, month, day] = row.startDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, row.startHour)).getTime() <= Date.now();
}

const LESSON_STATUS_LABELS: Record<string, string> = {
  unscheduled: 'Не назначено',
  proposed: 'На узгодженні',
  confirmed: 'Очікує проведення',
  rescheduling: 'Перенесення',
  done: 'Виконано',
  missed: 'Пропущено',
  admin_skip: 'Пропуск (адмін)',
  frozen: 'Заморожено',
  cancelled: 'Скасовано',
};

export function UserEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const { user: me, refreshUser } = useAuth();
  const [item, setItem] = useState<User | null>(null);
  const [tab, setTab] = useState<'main' | 'class' | 'tariffs' | 'access' | 'materials'>('main');
  const [auth, setAuth] = useState<UserAuthResponse | null>(null);
  const [tariffs, setTariffs] = useState<UserTariffsResponse | null>(null);
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userRole, setUserRole] = useState('');
  const [adminAccess, setAdminAccess] = useState('');
  const [adminRoleId, setAdminRoleId] = useState('');
  const [adminRoles, setAdminRoles] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { dirty, markSaved } = useDirtyForm(
    { name, firstName, lastName, middleName, birthDate, email, phone, userRole, adminAccess, adminRoleId },
    Boolean(item),
  );

  useEffect(() => {
    accessRolesApi
      .list()
      .then((data) =>
        setAdminRoles(data.roles.map((row) => ({ value: String(row.id), label: row.name }))),
      )
      .catch(() => setAdminRoles([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    usersApi
      .get(id)
      .then((data) => {
        setItem(data.user);
        setName(data.user.name);
        setFirstName(data.user.firstName ?? '');
        setLastName(data.user.lastName ?? '');
        setMiddleName(data.user.middleName ?? '');
        setBirthDate(data.user.birthDate ?? '');
        setEmail(data.user.email);
        setPhone(data.user.phone ?? '');
        setUserRole(data.user.userRole ?? '');
        setAdminAccess(adminAccessValue(data.user));
        setAdminRoleId(data.user.adminRole ? String(data.user.adminRole.id) : '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
    usersApi.auth(id).then(setAuth).catch(() => undefined);
    usersApi.tariffs(id).then(setTariffs).catch(() => undefined);
  }, [id]);

  useEffect(() => {
    if (tab === 'class' && item && item.userRole !== 'student' && item.userRole !== 'teacher') {
      setTab('main');
    }
    if (tab === 'materials' && item && item.userRole !== 'teacher') {
      setTab('main');
    }
  }, [item, tab]);

  async function reloadAuth() {
    const data = await usersApi.auth(id);
    setAuth(data);
    setItem(data.user);
  }

  function buildPayload() {
    return {
      name,
      firstName,
      lastName,
      middleName,
      birthDate: birthDate || null,
      email,
      phone,
      userRole: (userRole || null) as UserPanelRole | null,
      isSuperAdmin: adminAccess === 'super_admin',
      adminRoleId:
        adminAccess === 'admin_role'
          ? Number(adminRoleId)
          : adminAccess === ''
            ? null
            : null,
    };
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const data = await usersApi.update(id, buildPayload());
      setItem(data.user);
      markSaved();
      setOk('Збережено');
      if (me?.id === data.user.id) {
        await refreshUser();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onDuplicate() {
    setDuplicating(true);
    setError('');
    try {
      const payload = buildPayload();
      const created = await usersApi.create({
        name: withCopyLabel(name),
        firstName,
        lastName,
        middleName,
        birthDate: birthDate || null,
        email: withCopyEmail(email),
        userRole: payload.userRole ?? '',
        isSuperAdmin: payload.isSuperAdmin,
        adminRoleId: payload.adminRoleId ?? undefined,
      });
      if (phone.trim()) {
        await usersApi.update(created.user.id, {
          name: created.user.name,
          firstName,
          lastName,
          middleName,
          birthDate: birthDate || null,
          email: created.user.email,
          phone,
          userRole: payload.userRole,
          isSuperAdmin: payload.isSuperAdmin,
          adminRoleId: payload.adminRoleId,
        });
      }
      const warning = mailingNotSentWarning(created.mailing);
      window.alert(
        warning
          ? `Копію створено. Тимчасовий пароль: ${created.temporaryPassword}\n${warning}`
          : `Копію створено. Тимчасовий пароль: ${created.temporaryPassword}`,
      );
      router.push(`/users/${created.user.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    setError('');
    setDeleting(true);
    try {
      await usersApi.remove(item.id);
      setDeleteOpen(false);
      router.replace('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    } finally {
      setDeleting(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/users" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  const isSelf = me?.id === item.id;

  return (
    <>
      <PageHead
        sticky
        backHref="/users"
        backLabel="До користувачів"
        title={item.name || item.email}
        description={item.email !== item.name ? item.email : undefined}
        actions={
          <>
            <CreateUserButton hideTrigger open={createOpen} onOpenChange={setCreateOpen} />
            {tab === 'main' ? (
              <button className="btn" type="submit" form="user-form" disabled={busy || !dirty}>
                {busy ? 'Збереження…' : 'Зберегти'}
              </button>
            ) : null}
            <RecordActionsMenu
              createLabel="Новий користувач"
              onCreate={() => setCreateOpen(true)}
              onDuplicate={() => void onDuplicate()}
              duplicateBusy={duplicating}
              onDelete={
                me?.isSuperAdmin
                  ? () => {
                      setError('');
                      setDeleteOpen(true);
                    }
                  : undefined
              }
              deleteDisabled={isSelf}
            />
          </>
        }
      />

      <ConfirmModal
        open={deleteOpen}
        title="Видалити користувача"
        description={`Видалити користувача «${item.name || item.email}»? Цю дію не можна скасувати.`}
        confirmLabel="Видалити"
        busy={deleting}
        error={error}
        onConfirm={() => void onDelete()}
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
        }}
      />

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={`tab${tab === 'main' ? ' active' : ''}`} type="button" onClick={() => setTab('main')}>
          Загальне
        </button>
        {item.userRole === 'student' || item.userRole === 'teacher' ? (
          <button className={`tab${tab === 'class' ? ' active' : ''}`} type="button" onClick={() => setTab('class')}>
            Клас
          </button>
        ) : null}
        <button className={`tab${tab === 'tariffs' ? ' active' : ''}`} type="button" onClick={() => setTab('tariffs')}>
          Тарифи
        </button>
        <button className={`tab${tab === 'access' ? ' active' : ''}`} type="button" onClick={() => setTab('access')}>
          Доступ
        </button>
        {item.userRole === 'teacher' ? (
          <button
            className={`tab${tab === 'materials' ? ' active' : ''}`}
            type="button"
            onClick={() => setTab('materials')}
          >
            Матеріали
          </button>
        ) : null}
      </div>

      {tab === 'main' ? (
        <div className="panel">
          <div className="panel-head">
            <h3>Загальне</h3>
          </div>
          <form className="form-box" id="user-form" onSubmit={onSave}>
            <FormAlerts error={error} ok={ok} />
            <MetaBar
              items={[
                { label: 'ID', value: String(item.id) },
                { label: 'Доступ', value: formatUserAccess(item) },
                ...(item.userRole ? [{ label: 'Кабінет', value: USER_ROLE_LABELS[item.userRole] }] : []),
                ...(item.adminRole ? [{ label: 'Роль доступу', value: item.adminRole.name }] : []),
                { label: 'Статус', value: item.status === 'blocked' ? 'Заблокований' : 'Активний' },
                {
                  label: 'Активація',
                  value: item.isActivated
                    ? 'Активований'
                    : item.pendingPassword
                      ? `Не активований · ${item.pendingPassword}${
                          item.pendingExpiresAt
                            ? ` (до ${formatDateTime(item.pendingExpiresAt)})`
                            : ''
                        }`
                      : 'Акаунт ще не активований',
                },
                { label: 'Створено', value: formatDateTime(item.createdAt) },
                { label: 'Пароль', value: item.isActivated ? 'прихований' : 'тимчасовий вище' },
              ]}
            />
            <label htmlFor="name">Імʼя</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            <label htmlFor="lastName">Прізвище</label>
            <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <label htmlFor="firstName">Імʼя (власне)</label>
            <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <label htmlFor="middleName">По батькові</label>
            <input id="middleName" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            <label htmlFor="birthDate">Дата народження</label>
            <input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label htmlFor="phone">Телефон</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <label htmlFor="user-role">Доступ до кабінету</label>
            <Select
              id="user-role"
              value={userRole}
              onChange={setUserRole}
              options={USER_ROLE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <label htmlFor="admin-access">Доступ до адмінки</label>
            <Select
              id="admin-access"
              value={adminAccess}
              onChange={(next) => {
                setAdminAccess(next);
                if (next !== 'admin_role') setAdminRoleId('');
              }}
              options={ADMIN_ACCESS_OPTIONS.filter((option) =>
                me?.isSuperAdmin ? true : option.value !== 'super_admin',
              ).map((option) => ({ value: option.value, label: option.label }))}
              disabled={isSelf}
            />
            {adminAccess === 'admin_role' ? (
              <>
                <label htmlFor="admin-role">Роль доступу</label>
                <Select
                  id="admin-role"
                  value={adminRoleId}
                  onChange={setAdminRoleId}
                  options={adminRoles}
                  disabled={isSelf}
                />
              </>
            ) : null}
            {isSelf ? <p className="muted">Свій адмін-доступ змінити не можна.</p> : null}
          </form>
        </div>
      ) : null}

      {tab === 'class' ? <UserClassPanel item={item} /> : null}

      {tab === 'tariffs' ? (
        <UserTariffsPanel
          userId={item.id}
          data={tariffs}
          onChange={setTariffs}
        />
      ) : null}

      {tab === 'access' ? (
        <UserAccessPanel
          item={item}
          auth={auth}
          isSelf={isSelf}
          error={error}
          ok={ok}
          onError={setError}
          onOk={setOk}
          onReload={() => void reloadAuth()}
        />
      ) : null}

      {tab === 'materials' ? <UserMaterialsPanel item={item} /> : null}
    </>
  );
}

function UserTariffsPanel({
  userId,
  data,
  onChange,
}: {
  userId: number;
  data: UserTariffsResponse | null;
  onChange: (next: UserTariffsResponse) => void;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [lessons, setLessons] = useState<UserLessonsResponse | null>(null);
  const [pending, setPending] = useState<{ type: 'complete' | 'skip'; lesson: AdminLesson } | null>(null);
  const statusLabel: Record<string, string> = {
    active: 'Зараз',
    scheduled: 'Далі',
    expired: 'Минулий',
    cancelled: 'Скасовано',
  };

  useEffect(() => {
    usersApi.lessons(userId).then(setLessons).catch(() => setLessons({ freeze: null, lessons: [] }));
  }, [userId]);

  async function setPaid(subId: number, paidCount: number) {
    setBusyId(subId);
    setError('');
    try {
      onChange(await usersApi.setTariffPayments(userId, subId, paidCount));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося оновити оплату');
    } finally {
      setBusyId(null);
    }
  }

  async function refundLesson(lessonId: number) {
    setBusyId(lessonId);
    setError('');
    try {
      setLessons(await usersApi.refundLesson(userId, lessonId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося позначити повернення');
    } finally {
      setBusyId(null);
    }
  }

  async function applyPending() {
    if (!pending) return;
    setBusyId(pending.lesson.id);
    setError('');
    try {
      setLessons(
        pending.type === 'complete'
          ? await usersApi.completeLesson(userId, pending.lesson.id)
          : await usersApi.skipLesson(userId, pending.lesson.id),
      );
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося оновити статус уроку');
    } finally {
      setBusyId(null);
    }
  }

  const frozen = lessons?.lessons.filter((row) => row.status === 'frozen') ?? [];
  const allLessons = lessons?.lessons ?? [];

  return (
    <div className="panel tariffs-tab">
      <div className="panel-head">
        <h3>Тарифи</h3>
      </div>
      <div className="access-tab-body">
        <FormAlerts error={error} />
        {data ? (
          <>
            <div className="tariff-status-grid">
              <TariffStatusCard
                label="Поточний"
                row={data.current}
                empty="немає"
                tone="current"
                busy={busyId === data.current?.id}
                onPaid={setPaid}
              />
              <TariffStatusCard
                label="Далі"
                row={data.scheduled}
                empty="не заплановано"
                tone="next"
                busy={busyId === data.scheduled?.id}
                onPaid={setPaid}
              />
            </div>
            <section className="tariff-freeze">
              <header className="tariff-freeze-head">
                <div>
                  <p className="tariff-status-label">Заморозки</p>
                  <h4>
                    Заморожені уроки <span className="access-count">{frozen.length}</span>
                  </h4>
                </div>
                {lessons?.freeze && lessons.freeze.perMonth > 0 ? (
                  <p className="tariff-freeze-quota">
                    <b>
                      {lessons.freeze.used} з {lessons.freeze.perMonth}
                    </b>
                    <span>цього місяця</span>
                  </p>
                ) : (
                  <p className="tariff-freeze-quota is-off">
                    <b>Вимкнено</b>
                    <span>у тарифі немає ліміту</span>
                  </p>
                )}
              </header>
              {lessons?.freeze && lessons.freeze.perMonth > 0 ? (
                <div className="tariff-freeze-pips" aria-hidden>
                  {Array.from({ length: lessons.freeze.perMonth }, (_, index) => (
                    <span key={index} className={index < lessons.freeze!.used ? 'is-used' : undefined} />
                  ))}
                </div>
              ) : null}
              {frozen.length ? (
                <ul className="tariff-freeze-list">
                  {frozen.map((row) => (
                    <li key={row.id} className={row.refundedAt ? 'is-refunded' : 'is-pending'}>
                      <div className="tariff-freeze-copy">
                        <b>Урок {row.number}</b>
                        <span>
                          {row.tariffTitle}
                          {row.refundAmount ? ` · ${formatUah(row.refundAmount)} грн` : ''}
                          {freezeSlotLabel(row) ? ` · ${freezeSlotLabel(row)}` : ''}
                        </span>
                        <time>
                          {row.refundedAt
                            ? `Повернуто ${formatDateTime(row.refundedAt)}`
                            : row.frozenAt
                              ? `Заморожено ${formatDateTime(row.frozenAt)}`
                              : 'Очікує повернення'}
                        </time>
                      </div>
                      {row.refundedAt ? (
                        <span className="access-badge is-now">Кошти повернуто</span>
                      ) : (
                        <button
                          className="btn-outline"
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void refundLesson(row.id)}
                        >
                          {busyId === row.id ? 'Збереження…' : 'Повернути кошти'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="tariff-freeze-empty">Цього місяця ще немає заморожених уроків.</p>
              )}
            </section>
            <section className="tariff-freeze">
              <header className="tariff-freeze-head">
                <div>
                  <p className="tariff-status-label">Уроки</p>
                  <h4>
                    Записи занять <span className="access-count">{allLessons.length}</span>
                  </h4>
                </div>
              </header>
              {allLessons.length ? (
                <ul className="tariff-freeze-list">
                  {allLessons.map((row) => {
                    const canAct = row.status === 'confirmed';
                    const canComplete = canAct && lessonHasStarted(row);
                    return (
                      <li
                        key={row.id}
                        className={
                          row.status === 'done'
                            ? 'is-refunded'
                            : row.status === 'missed'
                              ? 'is-pending'
                              : undefined
                        }
                      >
                        <div className="tariff-freeze-copy">
                          <b>Урок {row.number}</b>
                          <span>
                            {row.tariffTitle}
                            {freezeSlotLabel(row) ? ` · ${freezeSlotLabel(row)}` : ''}
                            {row.teacher ? ` · ${row.teacher.name}` : ''}
                          </span>
                          <time>{LESSON_STATUS_LABELS[row.status] || row.status}</time>
                        </div>
                        {canAct ? (
                          <div className="tariff-lesson-actions">
                            <button
                              className="btn-outline"
                              type="button"
                              disabled={busyId === row.id || !canComplete}
                              title={!canComplete ? 'Виконано можна поставити після початку уроку' : undefined}
                              onClick={() => {
                                setError('');
                                setPending({ type: 'complete', lesson: row });
                              }}
                            >
                              Виконано
                            </button>
                            <button
                              className="btn-outline"
                              type="button"
                              disabled={busyId === row.id}
                              onClick={() => {
                                setError('');
                                setPending({ type: 'skip', lesson: row });
                              }}
                            >
                              Пропуск
                            </button>
                          </div>
                        ) : (
                          <span className="access-badge">{LESSON_STATUS_LABELS[row.status] || row.status}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="tariff-freeze-empty">У цього користувача ще немає уроків.</p>
              )}
            </section>
            <section className="access-block">
              <h4>
                Історія <span className="access-count">{data.history.length}</span>
              </h4>
              {data.history.length ? (
                <ul className="tariff-pay-history">
                  {data.history.map((row) => (
                    <li key={row.id}>
                      <div className="tariff-pay-history-row">
                        <span>
                          <span className={`access-badge${row.status === 'active' ? ' is-now' : row.status === 'scheduled' ? '' : ' is-user'}`}>
                            {statusLabel[row.status] || row.status}
                          </span>{' '}
                          {row.tariff.title}
                          <span className="muted">
                            {' '}
                            · {row.availableLessons} / {row.totalLessons} уроків
                          </span>
                        </span>
                        <time>
                          {formatDateTime(row.startsAt)} — {formatDateTime(row.endsAt)}
                        </time>
                      </div>
                      <PaymentParts
                        row={row}
                        busy={busyId === row.id}
                        onPaid={(count) => void setPaid(row.id, count)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Історії тарифів ще немає.</p>
              )}
            </section>
          </>
        ) : (
          <p className="muted">Завантаження…</p>
        )}
      </div>
      <ConfirmModal
        open={pending != null}
        title={pending?.type === 'skip' ? 'Пропуск уроку' : 'Виконаний урок'}
        description={
          pending?.type === 'skip'
            ? `Закрити урок ${pending.lesson.number} як пропуск адміністрації? Це для поважної причини, коли заморозки вже використано. Кошти не повертаються.`
            : `Позначити урок ${pending?.lesson.number ?? ''} як виконаний?`
        }
        confirmLabel={pending?.type === 'skip' ? 'Пропуск' : 'Виконано'}
        busy={pending != null && busyId === pending.lesson.id}
        busyLabel="Збереження…"
        error={error}
        onConfirm={() => void applyPending()}
        onClose={() => {
          if (pending && busyId === pending.lesson.id) return;
          setPending(null);
        }}
      />
    </div>
  );
}

function TariffStatusCard({
  label,
  row,
  empty,
  tone,
  busy,
  onPaid,
}: {
  label: string;
  row: UserTariffRecord | null;
  empty: string;
  tone: 'current' | 'next';
  busy: boolean;
  onPaid: (subId: number, paidCount: number) => void;
}) {
  if (!row) {
    return (
      <article className="tariff-status-card is-empty">
        <p className="tariff-status-label">{label}</p>
        <p className="tariff-status-title muted">{empty}</p>
      </article>
    );
  }

  const parts = row.payments.length || row.tariff.installmentCount || 1;
  const perPart = parts > 1 ? Math.round(row.tariff.price / parts) : null;

  return (
    <article className={`tariff-status-card is-${tone}`}>
      <p className="tariff-status-label">{label}</p>
      <p className="tariff-status-title">{row.tariff.title}</p>
      <div className="tariff-status-meta">
        <span className="access-badge">{row.tariff.lessons} уроків</span>
        {row.tariff.frozenLessonsPerMonth ? (
          <span className="access-badge">{row.tariff.frozenLessonsPerMonth} заморозок / міс</span>
        ) : null}
        {row.tariff.durationMonths ? (
          <span className="access-badge">{durationLabel(row.tariff.durationMonths)}</span>
        ) : null}
        <span className="access-badge is-user">{paymentPartsLabel(parts)}</span>
        <span className="access-badge is-now">
          {tone === 'next' ? `з ${formatDateTime(row.startsAt)}` : `до ${formatDateTime(row.endsAt)}`}
        </span>
      </div>
      <p className="tariff-status-price">
        {formatUah(row.tariff.price)} грн
        {row.tariff.lessonPrice ? ` · ${formatUah(row.tariff.lessonPrice)} грн / урок` : ''}
        {perPart ? ` · ${formatUah(perPart)} грн / частина` : ''}
      </p>
      <p className="tariff-status-price">
        Доступно уроків: {row.availableLessons} з {row.totalLessons}
      </p>
      <PaymentParts row={row} busy={busy} onPaid={(count) => onPaid(row.id, count)} />
    </article>
  );
}

function PaymentParts({
  row,
  busy,
  onPaid,
}: {
  row: UserTariffRecord;
  busy: boolean;
  onPaid: (paidCount: number) => void;
}) {
  const payments = row.payments ?? [];
  if (!payments.length) {
    return <p className="muted">Частини оплати ще не створені.</p>;
  }

  return (
    <div className="tariff-pay">
      <p className="tariff-pay-label">Оплата</p>
      <div className="tariff-pay-parts">
        {payments.map((part) => (
          <button
            key={part.id}
            className={`tariff-pay-part${part.paid ? ' is-paid' : ''}`}
            type="button"
            disabled={busy}
            onClick={() => onPaid(part.paid && row.paidCount === part.partNumber ? part.partNumber - 1 : part.partNumber)}
          >
            {payments.length === 1 ? 'Увесь тариф' : `${part.partNumber} частина`}
            <span>
              {part.lessons} ур. · {formatUah(part.amount)} грн
            </span>
          </button>
        ))}
        {payments.length > 1 ? (
          <button
            className={`tariff-pay-part is-all${row.paidCount === payments.length ? ' is-paid' : ''}`}
            type="button"
            disabled={busy}
            onClick={() => onPaid(row.paidCount === payments.length ? 0 : payments.length)}
          >
            Усі частини
          </button>
        ) : null}
      </div>
    </div>
  );
}

function UserAccessPanel({
  item,
  auth,
  isSelf,
  error,
  ok,
  onError,
  onOk,
  onReload,
}: {
  item: User;
  auth: UserAuthResponse | null;
  isSelf: boolean;
  error: string;
  ok: string;
  onError: (value: string) => void;
  onOk: (value: string) => void;
  onReload: () => void;
}) {
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState<'block' | 'reset' | null>(null);

  async function run(action: string, fn: () => Promise<void>) {
    setBusy(action);
    onError('');
    onOk('');
    try {
      await fn();
      onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Не вдалося виконати дію');
    } finally {
      setBusy('');
    }
  }

  return (
    <>
    <div className="panel access-tab">
      <div className="panel-head">
        <h3>Доступ</h3>
        <div className="head-actions">
          <button
            className="btn-outline"
            type="button"
            disabled={Boolean(busy)}
            onClick={() =>
              void run('logout', async () => {
                await usersApi.logout(item.id);
                onOk(isSelf ? 'Інші сесії завершено' : 'Користувача розлогінено');
              })
            }
          >
            {busy === 'logout' ? 'Вихід…' : isSelf ? 'Вийти з інших' : 'Розлогінити'}
          </button>
          {item.status === 'blocked' ? (
            <button
              className="btn"
              type="button"
              disabled={Boolean(busy)}
              onClick={() =>
                void run('unblock', async () => {
                  await usersApi.unblock(item.id);
                  onOk('Акаунт розблоковано');
                })
              }
            >
              {busy === 'unblock' ? 'Розблокування…' : 'Авторизувати'}
            </button>
          ) : (
            <button
              className="btn-danger"
              type="button"
              disabled={Boolean(busy) || isSelf}
              onClick={() => setConfirm('block')}
            >
              Заблокувати
            </button>
          )}
          <button
            className="btn-outline"
            type="button"
            disabled={Boolean(busy)}
            onClick={() => setConfirm('reset')}
          >
            Скинути пароль
          </button>
        </div>
      </div>
      <div className="access-tab-body">
        <FormAlerts error={error} ok={ok} />
        {auth ? (
          <>
            <div className="access-stats">
              <div className="access-stat">
                <span>Входів</span>
                <b>{auth.stats.loginCount}</b>
              </div>
              <div className="access-stat">
                <span>Останній вхід</span>
                <b>{auth.stats.lastLoginAt ? formatDateTime(auth.stats.lastLoginAt) : '—'}</b>
              </div>
              <div className="access-stat">
                <span>Головна</span>
                <b>{auth.stats.homeViews}</b>
              </div>
              <div className="access-stat">
                <span>Кабінет</span>
                <b>{auth.stats.cabinetViews}</b>
              </div>
            </div>

            <div className="access-split">
              <section className="access-block">
                <h4>
                  Сесії <span className="access-count">{auth.sessions.length}</span>
                </h4>
                {auth.sessions.length ? (
                  <ul className="access-sessions">
                    {auth.sessions.map((session) => (
                      <li key={session.id} className={`access-session${session.current ? ' is-current' : ''}`}>
                        <div>
                          <div className="access-session-top">
                            <span className={`access-badge${session.panel === 'user' ? ' is-user' : ''}`}>
                              {session.panel === 'admin' ? 'Адмінка' : 'Кабінет'}
                            </span>
                            {session.current ? <span className="access-badge is-now">ця сесія</span> : null}
                            <span className="mono">{session.ip || 'IP невідомий'}</span>
                          </div>
                          <p className="access-session-meta">{formatDateTime(session.lastUsedAt)}</p>
                        </div>
                        {session.current ? null : (
                          <button
                            className="btn-outline"
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() =>
                              void run(`revoke-${session.id}`, async () => {
                                await authAdminApi.revokeSession(session.id);
                                onOk('Сесію завершено');
                              })
                            }
                          >
                            Завершити
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Немає активних сесій.</p>
                )}
              </section>

              <section className="access-block">
                <h4>Останні події</h4>
                {auth.events.length ? (
                  <ul className="access-events">
                    {auth.events.slice(0, 12).map((event) => (
                      <li key={event.id}>
                        <span>
                          {EVENT_TYPE_LABELS[event.type] || event.type}
                          {event.path ? <span className="muted"> · {event.path}</span> : null}
                        </span>
                        <time>{formatDateTime(event.createdAt)}</time>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Подій ще немає.</p>
                )}
              </section>
            </div>
          </>
        ) : (
          <p className="muted">Завантаження активності…</p>
        )}
      </div>
    </div>

      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm === 'reset' ? 'Скинути пароль' : 'Заблокувати акаунт'}
        description={
          confirm === 'reset'
            ? 'Скинути пароль і завершити всі сесії цього користувача?'
            : 'Заблокувати акаунт і завершити всі сесії?'
        }
        confirmLabel={confirm === 'reset' ? 'Скинути' : 'Заблокувати'}
        busy={busy === 'block' || busy === 'reset'}
        onConfirm={() => {
          if (confirm === 'reset') {
            void run('reset', async () => {
              const data = await usersApi.resetPassword(item.id);
              setConfirm(null);
              window.alert(`Новий тимчасовий пароль: ${data.temporaryPassword}`);
              onOk('Пароль скинуто');
            });
            return;
          }
          void run('block', async () => {
            await usersApi.block(item.id);
            setConfirm(null);
            onOk('Акаунт заблоковано');
          });
        }}
        onClose={() => {
          if (busy) return;
          setConfirm(null);
        }}
      />
    </>
  );
}
