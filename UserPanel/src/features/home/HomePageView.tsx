import { HeroSection } from '@/features/home/HeroSection';
import { LeadForm } from '@/features/home/LeadForm';
import type { loadHomePage } from '@/features/home/loadHomePage';
import { AboutSection } from '@/features/home/sections/AboutSection';
import { FormatsSection } from '@/features/home/sections/FormatsSection';
import { HomeCtaSection } from '@/features/home/sections/HomeCtaSection';
import { LevelsSection } from '@/features/home/sections/LevelsSection';
import { PricingSection } from '@/features/home/sections/PricingSection';
import { ReviewsSection } from '@/features/home/sections/ReviewsSection';
import { RulesSection } from '@/features/home/sections/RulesSection';
import type { SiteBlock } from '@/lib/blocks';

type HomePageData = Awaited<ReturnType<typeof loadHomePage>>;

function renderSection(
  block: SiteBlock,
  data: Pick<HomePageData, 'aboutStats' | 'formats' | 'tariffs' | 'rules' | 'reviews'>,
) {
  switch (block.type) {
    case 'hero':
      return <HeroSection key={`hero-${block.id}`} block={block} />;
    case 'about':
      return <AboutSection key={`about-${block.id}`} block={block} stats={data.aboutStats} />;
    case 'levels':
      return <LevelsSection key={`levels-${block.id}`} block={block} />;
    case 'formats':
      return <FormatsSection key={`formats-${block.id}`} formats={data.formats} />;
    case 'pricing':
      return <PricingSection key={`pricing-${block.id}`} block={block} tariffs={data.tariffs} />;
    case 'rules':
      return <RulesSection key={`rules-${block.id}`} block={block} rules={data.rules} />;
    case 'reviews':
      return <ReviewsSection key={`reviews-${block.id}`} block={block} reviews={data.reviews} />;
    case 'cta':
      return <HomeCtaSection key={`cta-${block.id}`} block={block} />;
    case 'lead':
      return <LeadForm key={`lead-${block.id}`} block={block} />;
    default:
      return null;
  }
}

export function HomePageView({ aboutStats, formats, tariffs, rules, reviews, sections }: HomePageData) {
  const data = { aboutStats, formats, tariffs, rules, reviews };

  return <main>{sections.map((section) => renderSection(section.block, data))}</main>;
}
