'use client';

import Link from 'next/link';
import type { CabinetLesson, LessonActor } from './api';
import { lessonChip, lessonLabel, lessonState, lessonWhen } from './labels';

export function LessonRow({
  row,
  me,
  href,
  detailHref,
  busy,
  onPropose,
  onAccept,
  onDecline,
  onFreeze,
  onComplete,
  onMiss,
}: {
  row: CabinetLesson;
  me: LessonActor;
  href?: string;
  detailHref?: string;
  busy?: boolean;
  onPropose?: (id: number) => void;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onFreeze?: (id: number) => void;
  onComplete?: (id: number) => void;
  onMiss?: (id: number) => void;
}) {
  const canAnswer =
    !href && (row.status === 'proposed' || row.status === 'rescheduling') && row.waitingOn === me;
  const canFirstPropose = !href && row.status === 'unscheduled' && me === 'teacher' && onPropose;
  const canCounter = canAnswer && onPropose;
  const canReschedule =
    !href && row.status === 'confirmed' && onPropose && (me === 'teacher' || row.canStudentReschedule);
  const showFreeze = !href && me === 'student' && row.status === 'confirmed' && onFreeze;
  const showOutcome = !href && me === 'teacher' && row.status === 'confirmed' && (onComplete || onMiss);
  const showActions =
    canFirstPropose || canAnswer || canReschedule || showFreeze || showOutcome || detailHref;
  const body = (
    <>
      <span className={`cal-chip ${lessonChip(row, me)}`}>{lessonState(row, me)}</span>
      <div className="cal-busy-copy">
        <b>{lessonLabel(row)}</b>
        <span>
          {lessonWhen(row) || row.tariffTitle}
          {row.teacher && me === 'student' ? ` · ${row.teacher.name}` : ''}
          {row.status === 'frozen' && row.refundAmount ? ` · ${row.refundAmount} грн до повернення` : ''}
        </span>
      </div>
    </>
  );

  if (href) {
    return (
      <li className="is-link">
        <Link href={href} className="lesson-link">
          {body}
          <span className="student-roll-go" aria-hidden>
            →
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li>
      {body}
      {showActions ? (
        <div className="lesson-actions">
          {detailHref ? (
            <Link href={detailHref} className="cal-mini-btn">
              Матеріали
            </Link>
          ) : null}
          {canAnswer && onAccept ? (
            <button className="btn" type="button" disabled={busy} onClick={() => onAccept(row.id)}>
              Підтвердити
            </button>
          ) : null}
          {canAnswer && onDecline ? (
            <button className="btn ghost" type="button" disabled={busy} onClick={() => onDecline(row.id)}>
              {row.status === 'rescheduling' ? 'Залишити старий час' : 'Відхилити'}
            </button>
          ) : null}
          {canFirstPropose || canCounter || canReschedule ? (
            <button className="cal-mini-btn" type="button" disabled={busy} onClick={() => onPropose?.(row.id)}>
              {canFirstPropose ? 'Запропонувати' : canReschedule ? 'Перенести' : 'Інший час'}
            </button>
          ) : null}
          {showFreeze ? (
            <button className="cal-mini-btn" type="button" disabled={busy} onClick={() => onFreeze(row.id)}>
              Заморозити
            </button>
          ) : null}
          {showOutcome && onComplete ? (
            <button className="btn" type="button" disabled={busy} onClick={() => onComplete(row.id)}>
              Виконано
            </button>
          ) : null}
          {showOutcome && onMiss ? (
            <button className="btn ghost" type="button" disabled={busy} onClick={() => onMiss(row.id)}>
              Пропущено
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
