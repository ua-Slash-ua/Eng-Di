'use client';

import { useEffect, useId, useState } from 'react';

let cachedShowNew: boolean | null = null;
let inflight: Promise<boolean> | null = null;

async function loadShowNewBadges(): Promise<boolean> {
  if (cachedShowNew !== null) return cachedShowNew;
  if (!inflight) {
    inflight = fetch('/api/settings/ui', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return false;
        const payload = (await response.json()) as { settings?: { showNewBadges?: boolean } };
        return payload.settings?.showNewBadges === true;
      })
      .catch(() => false)
      .then((value) => {
        cachedShowNew = value;
        inflight = null;
        return value;
      });
  }
  return inflight;
}

/** Spiky “New” badge. Visibility is controlled by admin UI setting `showNewBadges`. */
export function NewBadge({ className = '' }: { className?: string }) {
  const gradId = useId().replace(/:/g, '');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadShowNewBadges().then((show) => {
      if (!cancelled) setVisible(show);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <span className={`new-badge ${className}`.trim()} aria-label="Нове">
      <svg className="new-badge-burst" viewBox="0 0 140 78" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="10" y1="8" x2="130" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#b6e038" />
            <stop offset="0.55" stopColor="#c8f04d" />
            <stop offset="1" stopColor="#e8ff8a" />
          </linearGradient>
        </defs>
        {/* Wide oval hedgehog — fat core so “New” sits clear of the spikes */}
        <path
          fill={`url(#${gradId})`}
          d="M70 1
             L81 12 L95 2 L92 14 L114 5 L104 17 L132 10 L116 22 L139 20 L122 30 L140 38 L122 42 L139 54 L116 50 L132 66 L104 56 L114 74 L92 60 L95 76 L81 62
             L70 77
             L59 62 L45 76 L48 60 L26 74 L36 56 L8 66 L24 50 L1 54 L18 42 L0 38 L18 30 L1 20 L24 22 L8 10 L36 17 L26 5 L48 14 L45 2 L59 12 Z"
        />
      </svg>
      <span className="new-badge-text">New</span>
    </span>
  );
}

/** Whether the global New-badge setting is on. */
export function useShowNewBadges() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadShowNewBadges().then((value) => {
      if (!cancelled) setShow(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return show;
}
