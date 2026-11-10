import Link from 'next/link';
import type { CabinetLesson } from './api';
import { lessonChip, lessonClock, lessonDayShort, lessonState } from './labels';

export function LessonTile({
  row,
  href,
  highlight,
}: {
  row: CabinetLesson;
  href: string;
  highlight?: boolean;
}) {
  const clock = lessonClock(row);
  const day = lessonDayShort(row);
  return (
    <Link
      href={href}
      className={`lesson-tile ${lessonChip(row, 'teacher')}${highlight ? ' is-next' : ''}`}
    >
      <span className="lesson-tile-no">{String(row.number).padStart(2, '0')}</span>
      <span className="lesson-tile-when">
        <b>{clock || '—'}</b>
        <span>{day || 'Дату не назначено'}</span>
      </span>
      <span className="lesson-tile-state">{lessonState(row, 'teacher')}</span>
    </Link>
  );
}
