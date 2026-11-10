'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CabinetBackRow } from '@/features/cabinet/CabinetBackRow';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { cabinetLessonsApi } from './api';
import { LessonMaterialPanel } from './LessonMaterialPanel';
import { LinkedTestsPanel } from '@/features/tests/LinkedTestsPanel';
import { lessonLabel, lessonWhen } from './labels';

export function StudentLessonView() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params?.lessonId);
  const [data, setData] = useState<Awaited<ReturnType<typeof cabinetLessonsApi.show>> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isInteger(lessonId) || lessonId < 1) {
      setError('Заняття не знайдено');
      return;
    }
    cabinetLessonsApi
      .show(lessonId)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [lessonId]);

  const row = data?.lesson;

  if (!data && !error) {
    return (
      <CabinetPage title="Заняття" lead="Матеріали до уроку.">
        <CabinetBackRow parentHref="/cabinet/student/lessons" parentLabel="До занять" />
        <p className="muted">Завантаження…</p>
      </CabinetPage>
    );
  }

  return (
    <CabinetPage
      kicker="Заняття"
      title={row ? lessonLabel(row) : 'Заняття'}
      lead={row ? lessonWhen(row) || row.tariffTitle : undefined}
    >
      <CabinetBackRow parentHref="/cabinet/student/lessons" parentLabel="До занять" />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="dash-stack lesson-detail-stack">
        {data?.material ? (
          <LessonMaterialPanel
            title={data.material.title}
            description={data.material.description}
            presentation={data.material.presentation}
          />
        ) : (
          <section className="dash-box lesson-material-panel">
            <div className="lesson-material-body">
              <p className="lesson-material-empty">До цього заняття ще не привʼязано матеріали від школи.</p>
            </div>
          </section>
        )}
        {data?.linkedTests?.length ? <LinkedTestsPanel tests={data.linkedTests} /> : null}
      </div>
    </CabinetPage>
  );
}
