'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, onUnauthorized, type User } from './api';
import { canAccessUserPanel } from './roles';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  updateProfile: (payload: {
    firstName: string;
    lastName: string;
    middleName: string;
    birthDate: string;
    phone: string;
  }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: () => Promise<{ email: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function assertUserPanelAccess(user: User): User {
  if (!canAccessUserPanel(user)) {
    throw new Error('Немає доступу до кабінету');
  }
  if (user.status === 'blocked') {
    throw new Error('Акаунт заблоковано');
  }
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onUnauthorized(() => {
      setUser(null);
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/cabinet')) {
        window.location.replace('/login');
      }
    });
    let cancelled = false;
    api<{ user: User }>('/api/auth/me')
      .then((data) => {
        if (cancelled) return;
        if (data.user.status === 'blocked') {
          throw new Error('blocked');
        }
        setUser(assertUserPanelAccess(data.user));
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const data = await api<{ user: User }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        try {
          assertUserPanelAccess(data.user);
        } catch (error) {
          await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
          throw error;
        }
        setUser(data.user);
        return data.user;
      },
      async updateProfile(payload) {
        const data = await api<{ user: User }>('/api/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setUser(data.user);
      },
      async changePassword(currentPassword, newPassword) {
        await api('/api/auth/password', {
          method: 'PATCH',
          body: JSON.stringify({ currentPassword, newPassword }),
        });
      },
      async requestPasswordReset() {
        const data = await api<{ email: string }>('/api/auth/password/forgot', {
          method: 'POST',
        });
        return { email: data.email };
      },
      async uploadAvatar(file) {
        const body = new FormData();
        body.append('file', file);
        const data = await api<{ user: User }>('/api/auth/profile/avatar', {
          method: 'POST',
          body,
        });
        setUser(data.user);
      },
      async removeAvatar() {
        const data = await api<{ user: User }>('/api/auth/profile/avatar/remove', {
          method: 'POST',
        });
        setUser(data.user);
      },
      async logout() {
        await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('AuthProvider is missing');
  }
  return ctx;
}
