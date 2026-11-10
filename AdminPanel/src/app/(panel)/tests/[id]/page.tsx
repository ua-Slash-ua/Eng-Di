import { redirect } from 'next/navigation';

export default async function TestRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/materials/tests/${id}`);
}
