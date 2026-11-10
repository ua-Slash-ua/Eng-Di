import { redirect } from 'next/navigation';

/** Creation moved to the shared CreatePageButton modal on /pages. */
export default function NewPage() {
  redirect('/pages');
}
