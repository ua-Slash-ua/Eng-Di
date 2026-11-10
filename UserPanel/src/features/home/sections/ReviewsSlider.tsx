'use client';

import { useEffect, useRef, useState } from 'react';
import { starLabel, type Review } from '@/lib/reviews';

type ReviewsSliderProps = {
  cards: Review[];
};

export function ReviewsSlider({ cards }: ReviewsSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [index, setIndex] = useState(1);
  const total = cards.length;

  function updateNav() {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    setHasOverflow(maxScroll > 4);
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft < maxScroll - 4);

    const card = track.querySelector<HTMLElement>('.postcard');
    const step = card ? card.offsetWidth + 22 : track.clientWidth;
    const visible = Math.max(1, Math.round(track.clientWidth / step));
    const first = Math.max(0, Math.round(track.scrollLeft / step));
    // Count through the last visible card (start with 3 of 5, end at 5 of 5).
    const current = Math.min(total, first + visible);
    setIndex(Math.max(visible, current));
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateNav();
    track.addEventListener('scroll', updateNav, { passive: true });
    window.addEventListener('resize', updateNav);
    return () => {
      track.removeEventListener('scroll', updateNav);
      window.removeEventListener('resize', updateNav);
    };
  }, [cards.length]);

  function scrollByDir(dir: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>('.postcard');
    const step = card ? card.offsetWidth + 22 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <div className="reviews-slider">
      <div className="reviews-slider-track" ref={trackRef}>
        {cards.map((item, i) => (
          <article className={`postcard reviews-slide${i % 2 ? ' is-tilt-b' : ' is-tilt-a'}`} key={item.id}>
            <div className="stars">{starLabel(item.rating)}</div>
            <p className="quote">{item.quote}</p>
            <div className="who">
              {item.author}
              {item.isOfficialAccount ? (
                <span className="review-official-badge" title="Учень EngDi">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="#3fd8b5" />
                    <path d="M8 12.5 10.8 15 16 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              ) : null}
            </div>
            <div className="lvl">{item.result}</div>
          </article>
        ))}
      </div>
      {total > 1 && hasOverflow ? (
        <div className="reviews-slider-nav">
          <button type="button" className="reviews-slider-btn" onClick={() => scrollByDir(-1)} disabled={!canPrev} aria-label="Попередній">
            ←
          </button>
          <div className="reviews-slider-progress">
            <span className="reviews-slider-progress-label">
              {index} / {total}
            </span>
            <div className="reviews-slider-progress-track">
              <span className="reviews-slider-progress-fill" style={{ width: `${(index / total) * 100}%` }} />
            </div>
          </div>
          <button type="button" className="reviews-slider-btn" onClick={() => scrollByDir(1)} disabled={!canNext} aria-label="Наступний">
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
