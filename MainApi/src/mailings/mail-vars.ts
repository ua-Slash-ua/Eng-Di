const MONTHS = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
];

export type MailPerson = {
  id: number;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
};

export function personVars(user: MailPerson) {
  return {
    name: user.name,
    first_name: user.firstName?.trim() || user.name.trim().split(/\s+/)[0] || '',
    last_name: user.lastName?.trim() || '',
    middle_name: user.middleName?.trim() || '',
    email: user.email,
  };
}

export function formatLessonWhen(value?: Date | null) {
  if (!value) return '';
  const day = value.getUTCDate();
  const month = MONTHS[value.getUTCMonth()] || '';
  const hour = String(value.getUTCHours()).padStart(2, '0');
  const minute = String(value.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month}, ${hour}:${minute}`;
}
