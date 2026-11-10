'use client';

import { useEffect, useState } from 'react';
import { CreateButton, type CreateModalControl } from '@/components/ui/CreateButton';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/lib/auth';
import { accessRolesApi } from '@/features/access-roles/api';
import { usersApi } from '../api';
import { ADMIN_ACCESS_OPTIONS, USER_ROLE_OPTIONS, mailingNotSentWarning, type UserPanelRole } from '../types';

type CreateUserButtonProps = {
  variant?: 'primary' | 'outline';
  onCreated?: () => void;
} & CreateModalControl;

export function CreateUserButton({ variant, onCreated, hideTrigger, open, onOpenChange }: CreateUserButtonProps) {
  const { user: me } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [userRole, setUserRole] = useState('');
  const [adminAccess, setAdminAccess] = useState('');
  const [adminRoleId, setAdminRoleId] = useState('');
  const [adminRoles, setAdminRoles] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (adminAccess !== 'admin_role') return;
    accessRolesApi
      .list()
      .then((data) =>
        setAdminRoles(data.roles.map((item) => ({ value: String(item.id), label: item.name }))),
      )
      .catch(() => setAdminRoles([]));
  }, [adminAccess]);

  function reset() {
    setEmail('');
    setName('');
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setBirthDate('');
    setUserRole('');
    setAdminAccess('');
    setAdminRoleId('');
  }

  async function onCreate() {
    if (adminAccess === 'admin_role' && !adminRoleId) {
      throw new Error('Оберіть роль доступу для адміністратора');
    }
    if (!userRole && !adminAccess) {
      throw new Error('Оберіть доступ до кабінету або адмін-панелі');
    }
    const created = await usersApi.create({
      email,
      firstName,
      lastName,
      middleName: middleName || undefined,
      birthDate: birthDate || null,
      name: name || undefined,
      userRole: userRole as UserPanelRole | '',
      isSuperAdmin: adminAccess === 'super_admin',
      adminRoleId: adminAccess === 'admin_role' ? Number(adminRoleId) : undefined,
    });
    reset();
    onCreated?.();
    const warning = mailingNotSentWarning(created.mailing);
    return {
      ok: `Акаунт створено. Тимчасовий пароль: ${created.temporaryPassword}`,
      warning,
    };
  }

  return (
    <CreateButton
      label="Новий користувач"
      modalTitle="Новий користувач"
      variant={variant}
      onCreate={onCreate}
      onOpen={reset}
      hideTrigger={hideTrigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <label htmlFor="new-user-email">Email</label>
      <input id="new-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label htmlFor="new-user-name">Імʼя</label>
      <input id="new-user-name" value={name} onChange={(e) => setName(e.target.value)} />
      <label htmlFor="new-user-last-name">Прізвище</label>
      <input
        id="new-user-last-name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
        minLength={2}
      />
      <label htmlFor="new-user-first-name">Імʼя (власне)</label>
      <input
        id="new-user-first-name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
        minLength={2}
      />
      <label htmlFor="new-user-middle-name">По батькові</label>
      <input id="new-user-middle-name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
      <label htmlFor="new-user-birth-date">Дата народження</label>
      <input id="new-user-birth-date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      <label htmlFor="new-user-cabinet">Доступ до кабінету</label>
      <Select
        id="new-user-cabinet"
        value={userRole}
        onChange={setUserRole}
        options={USER_ROLE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
      />
      <label htmlFor="new-user-admin">Доступ до адмінки</label>
      <Select
        id="new-user-admin"
        value={adminAccess}
        onChange={(next) => {
          setAdminAccess(next);
          if (next !== 'admin_role') setAdminRoleId('');
        }}
        options={ADMIN_ACCESS_OPTIONS.filter((item) =>
          me?.isSuperAdmin ? true : item.value !== 'super_admin',
        ).map((item) => ({ value: item.value, label: item.label }))}
      />
      {adminAccess === 'admin_role' ? (
        <>
          <label htmlFor="new-user-admin-role">Роль доступу</label>
          <Select
            id="new-user-admin-role"
            value={adminRoleId}
            onChange={setAdminRoleId}
            options={adminRoles}
          />
        </>
      ) : null}
    </CreateButton>
  );
}
