'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { accessRolesApi, type PermissionItem } from '../api';

export function AccessRoleEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const isNew = id === 'new';
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<{ groupLabel: string; permissions: PermissionItem[] }[]>([]);
  const [isSystem, setIsSystem] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const canWrite = hasPermission(user, 'admin_roles.write') && user?.isSuperAdmin;

  useEffect(() => {
    accessRolesApi
      .permissions()
      .then((data) => setCatalog(data.groups))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isNew) return;
    accessRolesApi
      .get(id)
      .then((data) => {
        setName(data.role.name);
        setDescription(data.role.description ?? '');
        setPermissionKeys(data.role.permissionKeys);
        setIsSystem(data.role.isSystem);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id, isNew]);

  const grouped = useMemo(() => catalog, [catalog]);

  function togglePermission(key: string) {
    setPermissionKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!canWrite) return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      if (isNew) {
        const created = await accessRolesApi.create({ name, description, permissionKeys });
        router.replace(`/access-roles/${created.role.id}`);
        setOk('Створено');
      } else {
        await accessRolesApi.update(id, { name, description, permissionKeys });
        setOk('Збережено');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!canWrite || isNew || isSystem) return;
    if (!window.confirm('Видалити роль доступу?')) return;
    setBusy(true);
    try {
      await accessRolesApi.remove(id);
      router.replace('/access-roles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    } finally {
      setBusy(false);
    }
  }

  if (!isNew && error && !name) {
    return <LoadError message={error} href="/access-roles" />;
  }

  if (!isNew && !name && !error) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHead
        backHref="/access-roles"
        backLabel="До ролей доступу"
        title={isNew ? 'Нова роль доступу' : name}
        actions={
          canWrite ? (
            <>
              <button className="btn" type="submit" form="access-role-form" disabled={busy}>
                {busy ? 'Збереження…' : 'Зберегти'}
              </button>
              {!isNew && !isSystem ? (
                <button className="btn ghost" type="button" onClick={() => void onDelete()} disabled={busy}>
                  Видалити
                </button>
              ) : null}
            </>
          ) : null
        }
      />
      <div className="panel">
        <form id="access-role-form" className="form-box access-role-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          <div className="access-role-fields">
            <label htmlFor="role-name">Назва</label>
            <input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!canWrite || isSystem}
            />
            <label htmlFor="role-description">Опис</label>
            <input
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canWrite}
              placeholder="Короткий опис ролі"
            />
          </div>

          <div className="permission-matrix">
            <h3 className="permission-matrix-title">Матриця доступів</h3>
            <div className="permission-groups">
              {grouped.map((group) => (
                <section key={group.groupLabel} className="permission-group">
                  <h4 className="permission-group-title">{group.groupLabel}</h4>
                  <div className="permission-list">
                    {group.permissions.map((permission) => (
                      <label key={permission.key} className="form-check">
                        <input
                          type="checkbox"
                          checked={permissionKeys.includes(permission.key)}
                          disabled={!canWrite}
                          onChange={() => togglePermission(permission.key)}
                        />
                        <span>{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
