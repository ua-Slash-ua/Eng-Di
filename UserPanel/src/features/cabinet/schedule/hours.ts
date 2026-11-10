export const WEEKDAYS = [
  { value: 1, short: 'Пн', label: 'Понеділок' },
  { value: 2, short: 'Вт', label: 'Вівторок' },
  { value: 3, short: 'Ср', label: 'Середа' },
  { value: 4, short: 'Чт', label: 'Четвер' },
  { value: 5, short: 'Пт', label: 'Пʼятниця' },
  { value: 6, short: 'Сб', label: 'Субота' },
  { value: 7, short: 'Нд', label: 'Неділя' },
] as const;

export const DEFAULT_WORK_START = 8 * 60;
export const DEFAULT_WORK_END = 20 * 60;

export function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatMinute(minute: number) {
  const safe = Math.max(0, Math.min(1440, minute));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${pad(hours)}:${pad(mins)}`;
}

export function parseMinute(value: string) {
  const [hours, mins] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return DEFAULT_WORK_START;
  return hours * 60 + mins;
}

export function timeOptions(fromHour = 6, toHour = 22, step = 30) {
  const options: { value: number; label: string }[] = [];
  for (let minute = fromHour * 60; minute <= toHour * 60; minute += step) {
    options.push({ value: minute, label: formatMinute(minute) });
  }
  return options;
}

export function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayYmd() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDayLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

export function formatLongDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatWeekRange(from: string) {
  const start = formatDayLabel(from);
  const end = formatDayLabel(shiftDate(from, 6));
  return `${start} — ${end}`;
}

export function weekdayLabel(weekday: number) {
  return WEEKDAYS.find((item) => item.value === weekday)?.label ?? '';
}
