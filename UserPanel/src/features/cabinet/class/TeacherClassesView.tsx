'use client';

import { useEffect, useState } from 'react';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { cabinetClassApi, type CabinetClass, type CabinetStudentCard } from './api';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('uk-UA');
}

function ageFrom(isoDate: string) {
  const birth = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function fullName(student: { name: string; lastName: string | null; firstName: string | null; middleName: string | null }) {
  const parts = [student.lastName, student.firstName, student.middleName].filter(Boolean);
  return parts.length ? parts.join(' ') : student.name || 'Без імені';
}

function initials(name: string, email = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const source = (parts[0] || email || '?').trim();
  return source.slice(0, 2).toUpperCase();
}

export function TeacherClassesView() {
  const [data, setData] = useState<CabinetClass | null>(null);
  const [card, setCard] = useState<CabinetStudentCard | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [cardError, setCardError] = useState('');

  useEffect(() => {
    cabinetClassApi
      .mine()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      setCard(null);
      setCardError('');
      return;
    }
    setCard(null);
    setCardError('');
    cabinetClassApi
      .student(selectedId)
      .then(setCard)
      .catch((err: unknown) => setCardError(err instanceof Error ? err.message : 'Не вдалося відкрити картку'));
  }, [selectedId]);

  if (!data && !error) {
    return (
      <CabinetPage title="Мої класи" lead="Учні, яких вам призначив менеджер.">
        <p className="muted">Завантаження…</p>
      </CabinetPage>
    );
  }

  const students = data?.students ?? [];

  if (selectedId != null) {
    const student = card?.student;
    const tariff = card?.tariff;
    const lessonShare = tariff && tariff.totalLessons > 0 ? Math.round((tariff.availableLessons / tariff.totalLessons) * 100) : 0;

    return (
      <CabinetPage title={student?.name || 'Картка учня'} lead="Контакти, профіль і стан уроків.">
        <button className="class-back" type="button" onClick={() => setSelectedId(null)}>
          До учнів
        </button>
        {cardError ? <p className="error">{cardError}</p> : null}
        {!student && !cardError ? <p className="muted">Завантаження…</p> : null}
        {student ? (
          <article className="student-pass">
            <header className="student-pass-head">
              {student.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.avatarUrl} alt="" className="student-av student-av-img" />
              ) : (
                <span className="student-av">{initials(fullName(student), student.email)}</span>
              )}
              <div>
                <p className="cabinet-banner-label">Учень</p>
                <h2>{fullName(student)}</h2>
                <p className="muted">
                  {student.isActivated
                    ? `Кабінет з ${formatDate(student.activatedAt || student.createdAt)}`
                    : 'Ще не входив у кабінет'}
                </p>
              </div>
              <span className={student.status === 'blocked' ? 'my-status is-expired' : 'my-status'}>
                {student.status === 'blocked' ? 'Заблокований' : 'Активний'}
              </span>
            </header>

            <dl className="student-pass-facts">
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${student.email}`}>{student.email}</a>
                </dd>
              </div>
              <div>
                <dt>Телефон</dt>
                <dd>
                  {student.phone ? <a href={`tel:${student.phone}`}>{student.phone}</a> : 'Не вказано'}
                </dd>
              </div>
              <div>
                <dt>Дата народження</dt>
                <dd>
                  {student.birthDate
                    ? `${formatDate(student.birthDate)}${ageFrom(student.birthDate) != null ? ` · ${ageFrom(student.birthDate)} р.` : ''}`
                    : 'Не вказано'}
                </dd>
              </div>
              <div>
                <dt>Прізвище</dt>
                <dd>{student.lastName || '—'}</dd>
              </div>
              <div>
                <dt>Імʼя</dt>
                <dd>{student.firstName || student.name || '—'}</dd>
              </div>
              <div>
                <dt>По батькові</dt>
                <dd>{student.middleName || '—'}</dd>
              </div>
              <div>
                <dt>У школі з</dt>
                <dd>{formatDate(student.createdAt)}</dd>
              </div>
              <div>
                <dt>Кабінет</dt>
                <dd>{student.isActivated ? 'Активований' : 'Очікує входу'}</dd>
              </div>
              <div>
                <dt>Уроків у пакеті</dt>
                <dd>{student.lessons.total}</dd>
              </div>
            </dl>

            {student.lessons.total ? (
              <div className="student-pass-stats">
                <span>Підтверджено {student.lessons.confirmed}</span>
                <span>Очікують {student.lessons.proposed}</span>
                <span>Не назначено {student.lessons.unscheduled}</span>
                <span>Виконано {student.lessons.done}</span>
                {student.lessons.missed ? <span>Пропущено {student.lessons.missed}</span> : null}
                {student.lessons.adminSkip ? <span>Пропуск адміна {student.lessons.adminSkip}</span> : null}
                {student.lessons.frozen ? <span>Заморожено {student.lessons.frozen}</span> : null}
              </div>
            ) : null}

            {tariff ? (
              <section className="student-pass-tariff">
                <div>
                  <p className="cabinet-banner-label">Поточний тариф</p>
                  <h3>{tariff.title}</h3>
                  <p className="muted">
                    {formatDate(tariff.startsAt)} — {formatDate(tariff.endsAt)}
                  </p>
                </div>
                <div className="student-pass-lessons">
                  <p>
                    <b>{tariff.availableLessons}</b>
                    <span> / {tariff.totalLessons} уроків</span>
                  </p>
                  <div className="student-pass-bar" aria-hidden>
                    <span style={{ width: `${lessonShare}%` }} />
                  </div>
                </div>
              </section>
            ) : (
              <section className="student-pass-tariff is-empty">
                <div>
                  <p className="cabinet-banner-label">Тариф</p>
                  <h3>Немає активного пакета</h3>
                  <p className="muted">Учень ще не підключив тариф.</p>
                </div>
              </section>
            )}
          </article>
        ) : null}
      </CabinetPage>
    );
  }

  return (
    <CabinetPage title="Мої класи" lead="Натисніть на учня, щоб відкрити його картку.">
      {error ? <p className="error">{error}</p> : null}
      {!students.length ? (
        <article className="cabinet-banner is-empty">
          <div>
            <p className="cabinet-banner-label">Поки порожньо</p>
            <p className="cabinet-banner-title">Вам ще не призначено учнів</p>
            <p className="muted">Це зробить адміністратор у картці вчителя.</p>
          </div>
        </article>
      ) : (
        <section className="student-roll-wrap">
          <h2 className="tariff-history-title">
            Учні <span className="student-roll-count">{students.length}</span>
          </h2>
          <ul className="student-roll">
            {students.map((student) => (
              <li key={student.id}>
                <button className="student-roll-item" type="button" onClick={() => setSelectedId(student.id)}>
                  <span className="student-av">{initials(student.name, student.email)}</span>
                  <span className="student-roll-meta">
                    <b>{student.name || 'Без імені'}</b>
                    <span>{student.email}</span>
                  </span>
                  <span className={student.status === 'blocked' ? 'my-status is-expired' : 'my-status'}>
                    {student.status === 'blocked' ? 'Заблокований' : 'Активний'}
                  </span>
                  <span className="student-roll-go" aria-hidden>
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </CabinetPage>
  );
}
