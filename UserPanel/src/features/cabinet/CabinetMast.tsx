'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { cabinetBasePath } from '@/lib/roles';

export function CabinetMast() {
  const { user, logout } = useAuth();
  if (!user) {
    return null;
  }

  const profileHref = `${cabinetBasePath(user.userRole)}/profile`;
  const initial = user.name.trim().charAt(0).toUpperCase() || 'U';
  const roleLabel = user.userRole === 'teacher' ? 'Вчитель' : 'Учень';

  return (
    <header className="cabinet-mast">
      <Link href={profileHref} className="cabinet-mast-user" title="Відкрити профіль">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="cabinet-mast-avatar-img" />
        ) : (
          <span className="cabinet-mast-avatar" aria-hidden>
            {initial}
          </span>
        )}
        <span className="cabinet-mast-copy">
          <b>{user.name}</b>
          <small>{roleLabel}</small>
        </span>
      </Link>
      <button className="cabinet-mast-out" type="button" onClick={() => void logout()}>
        Вийти
      </button>
    </header>
  );
}
