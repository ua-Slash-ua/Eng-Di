'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { previousCabinetPath, sameCabinetPath } from './cabinetNavTrail';

function BackIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <path d="M19 12H7" />
      <path d="M12 6 6 12l6 6" />
    </svg>
  );
}

export function CabinetBackRow({
  parentHref,
  parentLabel,
}: {
  parentHref: string;
  parentLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [hideHistory, setHideHistory] = useState(() =>
    sameCabinetPath(previousCabinetPath(), parentHref),
  );

  useEffect(() => {
    setHideHistory(sameCabinetPath(previousCabinetPath(), parentHref));
  }, [pathname, parentHref]);

  return (
    <p className="cabinet-back-row">
      {hideHistory ? null : (
        <button type="button" className="btn ghost" onClick={() => router.back()}>
          <BackIcon />
          Назад
        </button>
      )}
      <Link href={parentHref} className="btn ghost">
        <BackIcon />
        {parentLabel}
      </Link>
    </p>
  );
}
