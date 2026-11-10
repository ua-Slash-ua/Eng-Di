'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cabinetLessonsApi } from '../lessons/api';
import { LessonSlotModal } from '../lessons/LessonSlotModal';
import type { ScheduleLessonMark } from './api';
import { LessonContextMenu, type LessonMenuAction } from './LessonContextMenu';
import { scheduleLessonHref, scheduleStudentHref } from './lessonLinks';

export function useScheduleLessonMenu(onRefresh?: () => Promise<void> | void) {
  const { user } = useAuth();
  const router = useRouter();
  const role = user?.userRole ?? null;
  const [menu, setMenu] = useState<{ x: number; y: number; lesson: ScheduleLessonMark } | null>(null);
  const [picking, setPicking] = useState<ScheduleLessonMark | null>(null);
  const [missing, setMissing] = useState<ScheduleLessonMark | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [menuLocked, setMenuLocked] = useState(false);
  const longPress = useRef<{
    timer: number;
    lesson: ScheduleLessonMark;
    x: number;
    y: number;
    startX: number;
    startY: number;
    opened: boolean;
  } | null>(null);
  const skipClick = useRef(false);
  const lastPointerType = useRef('mouse');

  const openLesson = useCallback(
    (lesson: ScheduleLessonMark) => {
      router.push(scheduleLessonHref(role, lesson));
    },
    [role, router],
  );

  const items = useMemo(() => {
    if (!menu) return [];
    const lesson = menu.lesson;
    const next: { id: LessonMenuAction; label: string }[] = [{ id: 'open', label: 'Відкрити урок' }];
    if (role === 'teacher') next.push({ id: 'student', label: 'Переглянути учня' });
    if (
      (lesson.status === 'proposed' || lesson.status === 'rescheduling') &&
      lesson.waitingOn === role
    ) {
      next.push(
        { id: 'accept', label: 'Підтвердити' },
        {
          id: 'decline',
          label: lesson.status === 'rescheduling' ? 'Залишити старий час' : 'Відхилити',
        },
      );
    }
    const canPropose =
      (lesson.status === 'confirmed' &&
        (role === 'teacher' || lesson.canStudentReschedule)) ||
      ((lesson.status === 'proposed' || lesson.status === 'rescheduling') &&
        ((role === 'teacher' && lesson.proposedBy === 'student') ||
          (role === 'student' && lesson.proposedBy === 'teacher')));
    if (canPropose) {
      next.push({
        id: 'propose',
        label: lesson.status === 'confirmed' ? 'Перенести' : 'Інший час',
      });
    }
    if (role === 'teacher' && lesson.status === 'confirmed') {
      next.push({ id: 'complete', label: 'Виконано' }, { id: 'miss', label: 'Пропущено' });
    }
    if (role === 'student' && lesson.status === 'confirmed') {
      next.push({ id: 'freeze', label: 'Заморозити' });
    }
    return next;
  }, [menu, role]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
      setMenu(null);
      setPicking(null);
      setMissing(null);
      await onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setBusy(false);
    }
  }

  function clearLongPress() {
    if (longPress.current?.timer) window.clearTimeout(longPress.current.timer);
    longPress.current = null;
  }

  function openMenuAt(x: number, y: number, lesson: ScheduleLessonMark) {
    setError('');
    setMenu({ x, y, lesson });
  }

  function onLessonClick(event: React.MouseEvent, lesson: ScheduleLessonMark) {
    event.preventDefault();
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    setMenu(null);
    openLesson(lesson);
  }

  function onLessonContext(event: React.MouseEvent, lesson: ScheduleLessonMark) {
    event.preventDefault();
    event.stopPropagation();
    if (lastPointerType.current !== 'mouse') return;
    skipClick.current = true;
    clearLongPress();
    openMenuAt(event.clientX, event.clientY, lesson);
  }

  function onLessonPointerDown(event: React.PointerEvent, lesson: ScheduleLessonMark) {
    lastPointerType.current = event.pointerType;
    if (event.pointerType === 'mouse') return;
    clearLongPress();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    const x = event.clientX;
    const y = event.clientY;
    longPress.current = {
      timer: window.setTimeout(() => {
        const press = longPress.current;
        if (!press) return;
        press.opened = true;
        skipClick.current = true;
        setMenuLocked(true);
        openMenuAt(press.x, press.y, press.lesson);
        try {
          navigator.vibrate?.(12);
        } catch {
          /* ignore */
        }
      }, 500),
      lesson,
      x,
      y,
      startX: x,
      startY: y,
      opened: false,
    };
  }

  function onLessonPointerMove(event: React.PointerEvent) {
    const press = longPress.current;
    if (!press || press.opened) return;
    const dx = event.clientX - press.startX;
    const dy = event.clientY - press.startY;
    if (dx * dx + dy * dy > 24 * 24) clearLongPress();
  }

  function onLessonPointerEnd() {
    if (longPress.current?.opened) skipClick.current = true;
    clearLongPress();
    window.setTimeout(() => setMenuLocked(false), 80);
  }

  function lessonHitProps(lesson: ScheduleLessonMark) {
    return {
      onClick: (event: React.MouseEvent) => onLessonClick(event, lesson),
      onContextMenu: (event: React.MouseEvent) => onLessonContext(event, lesson),
      onPointerDown: (event: React.PointerEvent) => onLessonPointerDown(event, lesson),
      onPointerMove: onLessonPointerMove,
      onPointerUp: onLessonPointerEnd,
      onPointerCancel: onLessonPointerEnd,
    };
  }

  async function onPick(id: LessonMenuAction) {
    if (!menu) return;
    const lesson = menu.lesson;
    if (id === 'open') {
      setMenu(null);
      openLesson(lesson);
      return;
    }
    if (id === 'student') {
      setMenu(null);
      router.push(scheduleStudentHref(lesson));
      return;
    }
    if (id === 'propose') {
      setMenu(null);
      setPicking(lesson);
      return;
    }
    if (id === 'miss') {
      setMenu(null);
      setMissing(lesson);
      return;
    }
    if (id === 'accept') return run(() => cabinetLessonsApi.accept(lesson.id));
    if (id === 'decline') return run(() => cabinetLessonsApi.decline(lesson.id));
    if (id === 'complete') return run(() => cabinetLessonsApi.complete(lesson.id));
    if (id === 'freeze') return run(() => cabinetLessonsApi.freeze(lesson.id));
  }

  const ui = (
    <>
      {error ? <p className="error">{error}</p> : null}
      {menu ? (
        <LessonContextMenu
          lesson={menu.lesson}
          x={menu.x}
          y={menu.y}
          items={items}
          busy={busy}
          locked={menuLocked}
          onPick={(id) => void onPick(id)}
          onClose={() => setMenu(null)}
        />
      ) : null}
      {picking ? (
        <LessonSlotModal
          lessonId={picking.id}
          title={picking.status === 'confirmed' ? 'Перенести урок' : 'Інший час'}
          onClose={() => setPicking(null)}
          onPicked={(date, hour, minute) =>
            run(() => cabinetLessonsApi.propose(picking.id, date, hour, minute ?? 0))
          }
        />
      ) : null}
      {missing ? (
        <div className="cabinet-modal-backdrop" onClick={() => setMissing(null)} role="presentation">
          <div className="cabinet-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="cabinet-modal-body">
              <h3>Учень пропустив урок?</h3>
              <p>
                Урок {missing.number}
                {missing.with ? ` · ${missing.with}` : ''} буде позначено як пропущений без поважної причини.
              </p>
            </div>
            <div className="cabinet-modal-actions">
              <button className="btn ghost" type="button" disabled={busy} onClick={() => setMissing(null)}>
                Скасувати
              </button>
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() => void run(() => cabinetLessonsApi.miss(missing.id))}
              >
                {busy ? 'Збереження…' : 'Пропущено'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  return { onLessonClick, onLessonContext, lessonHitProps, ui };
}
