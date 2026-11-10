'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { accessRolesApi, type AdminRoleItem } from '../api';

export function AccessRolesListView() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AdminRoleItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    accessRolesApi
      .list()
      .then((data) => setRoles(data.roles))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, []);

  if (error && !roles.length) {
    return <LoadError message={error} href="/" />;
  }

  if (!roles.length && !error) {
    return <LoadingState />;
  }

  const canWrite = hasPermission(user, 'admin_roles.write') && user?.isSuperAdmin;

  return (
    <>
      <PageHead
        title="Ролі доступу"
        description="Шаблони прав для обмежених адміністраторів"
        actions={
          canWrite ? (
            <Link className="btn" href="/access-roles/new">
              Нова роль
            </Link>
          ) : null
        }
      />
      <FormAlerts error={error} />
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Опис</th>
              <th>Користувачів</th>
              <th>Тип</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td>
                  <Link href={`/access-roles/${role.id}`}>{role.name}</Link>
                </td>
                <td>{role.description || '—'}</td>
                <td>{role.userCount}</td>
                <td>{role.isSystem ? 'Системна' : 'Кастомна'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
