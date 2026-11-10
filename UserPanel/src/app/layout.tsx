import type { Metadata } from 'next';
import { Baloo_2, Caveat, Nunito } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { PageAnalytics } from '@/components/PageAnalytics';
import { isNextProductionBuild } from '@/lib/build';
import { fetchBranding } from '@/lib/branding';
import './globals.css';

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

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: 'EngDi — школа англійської',
    description: 'Онлайн-заняття англійською. Заявка, тарифи і кабінет учня.',
  };
  if (isNextProductionBuild()) {
    return base;
  }
  const branding = await fetchBranding();
  return {
    ...base,
    icons: branding.faviconUrl
      ? [
          { rel: 'icon', url: branding.faviconUrl, sizes: 'any' },
          { rel: 'shortcut icon', url: branding.faviconUrl },
        ]
      : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className={`${nunito.variable} ${baloo.variable} ${caveat.variable}`}>
        <AuthProvider>
          <PageAnalytics />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
