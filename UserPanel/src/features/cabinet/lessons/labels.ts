import { WEEKDAYS, formatDayLabel, formatMinute } from '../schedule/hours';
import type { CabinetLesson, LessonActor, StudentLessonPack } from './api';

export function lessonLabel(row: CabinetLesson) {
  return `Урок ${row.number}`;
}

export function lessonClock(row: CabinetLesson) {
  if (row.startHour == null) return '';
  return formatMinute(row.startHour * 60 + (row.startMinute ?? 0));
}

export function lessonDayShort(row: CabinetLesson) {
  if (!row.startDate) return '';
  const [year, month, date] = row.startDate.split('-').map(Number);
  const weekday = new Date(year, month - 1, date).getDay();
  const day = WEEKDAYS.find((item) => item.value === (weekday === 0 ? 7 : weekday));
  return `${day?.short ?? ''} ${formatDayLabel(row.startDate)}`;
}

export function lessonWhen(row: CabinetLesson) {
  const day = lessonDayShort(row);
  const clock = lessonClock(row);
  if (!day || !clock) return '';
  return `${day} · ${clock}`;
}

export function lessonState(row: CabinetLesson, me: LessonActor) {
  if (row.status === 'unscheduled') return 'Не назначено';
  if (row.status === 'proposed') {
    return row.waitingOn === me ? 'Потрібна відповідь' : 'Чекаємо відповіді';
  }
  if (row.status === 'rescheduling') {
    return row.waitingOn === me ? 'Перенесення — потрібна відповідь' : 'Перенесення — чекаємо';
  }
  if (row.status === 'confirmed') return 'Очікує проведення';
  if (row.status === 'done') return 'Виконано';
  if (row.status === 'missed') return 'Пропущено';
  if (row.status === 'admin_skip') return 'Пропуск (адмін)';
  if (row.status === 'frozen') {
    return row.refundedAt ? 'Кошти повернуто' : 'Заморожено';
  }
  return 'Скасовано';
}

export function lessonChip(row: CabinetLesson, me: LessonActor) {
  if (row.status === 'confirmed' || row.status === 'done') return 'is-ok';
  if (row.status === 'missed') return 'is-busy';
  if (row.status === 'admin_skip') return 'is-off';
  if (row.status === 'frozen' && row.refundedAt) return 'is-ok';
  if (row.status === 'frozen') return 'is-daily';
  if ((row.status === 'proposed' || row.status === 'rescheduling') && row.waitingOn === me) return 'is-busy';
  if (row.status === 'proposed' || row.status === 'rescheduling') return 'is-daily';
  return 'is-off';
}

export function lessonHint(row: CabinetLesson, me: LessonActor) {
  if (row.status === 'unscheduled') {
    return me === 'teacher'
      ? 'Запропонуйте час. Уроки ставляться за номерами.'
      : 'Чекаємо, поки вчитель запропонує час.';
  }
  if (row.status === 'proposed') {
    return row.waitingOn === me
      ? 'Підтвердіть слот, відхиліть або запропонуйте інший час.'
      : me === 'teacher'
        ? 'Чекаємо відповіді учня.'
        : 'Чекаємо відповіді вчителя.';
  }
  if (row.status === 'rescheduling') {
    return row.waitingOn === me
      ? 'Підтвердіть новий час, залиште попередній або запропонуйте інший. Матеріали уроку зберігаються.'
      : me === 'teacher'
        ? 'Чекаємо відповіді учня на перенесення. Матеріали уроку вже закріплені.'
        : 'Чекаємо відповіді вчителя на перенесення. Матеріали уроку вже закріплені.';
  }
  if (row.status === 'confirmed') {
    return me === 'teacher'
      ? 'Після початку — виконано або пропущено. Якщо треба змінити час — перенесіть урок (матеріали залишаться).'
      : row.canStudentReschedule
        ? 'Слот підтверджено. Можна перенести час або заморозити урок, якщо не зможете бути.'
        : 'Слот підтверджено. Після початку уроку перенести може лише вчитель. Заморозка — якщо доступна.';
  }
  if (row.status === 'done') return 'Урок проведено.';
  if (row.status === 'missed') return 'Учень пропустив урок без поважної причини.';
  if (row.status === 'admin_skip') return 'Адміністратор закрив урок через поважну причину.';
  if (row.status === 'frozen') {
    return row.refundedAt ? 'Кошти за цей урок уже повернуто.' : 'Урок заморожено. Кошти поверне адміністратор.';
  }
  return '';
}

export function nextConfirmed(rows: CabinetLesson[]) {
  return [...rows]
    .filter((row) => row.status === 'confirmed')
    .sort((a, b) => {
      const left = `${a.startDate ?? ''} ${String(a.startHour ?? '').padStart(2, '0')}:${String(a.startMinute ?? 0).padStart(2, '0')}`;
      const right = `${b.startDate ?? ''} ${String(b.startHour ?? '').padStart(2, '0')}:${String(b.startMinute ?? 0).padStart(2, '0')}`;
      return left.localeCompare(right);
    })[0];
}

export function splitLessonPack(pack: StudentLessonPack) {
  return {
    waiting: pack.upcoming.filter((row) => row.status === 'proposed' || row.status === 'rescheduling'),
    confirmed: pack.upcoming.filter((row) => row.status === 'confirmed'),
    unscheduled: pack.unscheduled,
    frozen: pack.frozen ?? [],
    done: pack.done ?? [],
    missed: pack.missed ?? [],
    adminSkip: pack.adminSkip ?? [],
  };
}

export function personInitials(name: string, email = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const source = (parts[0] || email || '?').trim();
  return source.slice(0, 2).toUpperCase();
}

export function freezeCountLabel(count: number) {
  const n = Math.max(0, Math.floor(count) || 0);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} заморозка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} заморозки`;
  return `${n} заморозок`;
}
