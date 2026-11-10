export function addMonths(from: Date, months: number) {
  const next = new Date(from.getTime());
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() !== day) {
    next.setDate(0);
  }
  return next;
}

export function formatUaDate(value: Date) {
  return value.toLocaleDateString('uk-UA');
}
