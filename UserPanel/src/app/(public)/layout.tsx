import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { fetchBranding } from '@/lib/branding';
import { fetchContacts } from '@/lib/contacts';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [contacts, branding] = await Promise.all([fetchContacts(), fetchBranding()]);

  return (
    <div className="page">
      <SiteHeader logoUrl={branding.logoUrl} />
      {children}
      <SiteFooter contacts={contacts} logoUrl={branding.logoUrl} />
    </div>
  );
}
