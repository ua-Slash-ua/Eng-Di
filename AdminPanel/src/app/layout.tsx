import type { Metadata } from 'next';
import { Baloo_2, Caveat, JetBrains_Mono, Nunito } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { isNextProductionBuild } from '@/lib/build';
import { resolveMainApiUrl } from '@/lib/env';
import './globals.css';

const API = resolveMainApiUrl();

async function fetchFaviconUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${API}/api/settings/branding`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as { settings?: { faviconUrl?: string | null } };
    return json.settings?.faviconUrl?.trim() || null;
  } catch {
    return null;
  }
}

const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
});

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
});

const caveat = Caveat({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700'],
  variable: '--font-script',
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = { title: 'EngDi — панель керування' };
  if (isNextProductionBuild()) {
    return base;
  }
  const faviconUrl = await fetchFaviconUrl();
  return {
    ...base,
    icons: faviconUrl
      ? [
          { rel: 'icon', url: faviconUrl, sizes: 'any' },
          { rel: 'shortcut icon', url: faviconUrl },
        ]
      : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className={`${nunito.variable} ${baloo.variable} ${caveat.variable} ${mono.variable} ${nunito.className}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
