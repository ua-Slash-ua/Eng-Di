'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, onUnauthorized, type User } from './api';
import { canAccessAdminPanel } from './permissions';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function assertAdminPanelAccess(user: User): User {
  if (!canAccessAdminPanel(user)) {
    throw new Error('Немає доступу до адмін-панелі');
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
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.replace('/login');
      }
    });
    api<{ user: User }>('/api/auth/me')
      .then((data) => setUser(assertAdminPanelAccess(data.user)))
      .catch(async () => {
        await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        setUser(null);
      })
      .finally(() => setLoading(false));
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
          assertAdminPanelAccess(data.user);
        } catch (error) {
          await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
          throw error;
        }
        setUser(data.user);
      },
      async logout() {
        await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        setUser(null);
      },
      async refreshUser() {
        const data = await api<{ user: User }>('/api/auth/me');
        setUser(assertAdminPanelAccess(data.user));
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
