import { HomePageView } from '@/features/home/HomePageView';
import { loadHomePage } from '@/features/home/loadHomePage';

export default async function HomePage() {
  const data = await loadHomePage();
  return <HomePageView {...data} />;
}
