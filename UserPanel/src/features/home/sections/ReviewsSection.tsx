import { Section } from '@/components/ui/Section';
import { SectionHead } from '@/components/ui/SectionHead';
import type { SiteBlock } from '@/lib/blocks';
import { ICONS } from '@/lib/svgIcon';
import type { Review } from '@/lib/reviews';
import { ReviewsSlider } from './ReviewsSlider';

type ReviewsSectionProps = {
  block: SiteBlock;
  reviews: Review[];
};

export function ReviewsSection({ block, reviews }: ReviewsSectionProps) {
  const cards = block.reviews?.length ? block.reviews : reviews;
  const eyebrow = block.plaque?.trim() || 'Відгуки';
  const title = block.title?.trim() || 'Що кажуть наші учні';

  return (
    <Section id="reviews">
      <SectionHead eyebrow={eyebrow} eyebrowIcon={ICONS.envelope} title={title} />
      <ReviewsSlider cards={cards} />
    </Section>
  );
}
