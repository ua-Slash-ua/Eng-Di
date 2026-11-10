'use client';

import Link from 'next/link';
import type { LinkedTest } from '../types';

const ENTITY_LABEL: Record<LinkedTest['entityType'], string> = {
  level: 'Рівень',
  course: 'Курс',
  unit: 'Юніт',
  lesson: 'Урок',
};

export function LessonLinkedTestsPanel({
  tests,
  lessonId,
}: {
  tests: LinkedTest[];
  lessonId: number;
}) {
  if (!tests.length) return null;

  return (
    <div className="linked-tests-panel">
      <h3 className="linked-tests-title">Тести до уроку</h3>
      <p className="muted linked-tests-lead">
        Тести, прив&apos;язані до цього уроку або батьківських матеріалів у ланцюжку.
      </p>
      <div className="linked-tests-list">
        {tests.map((test) => {
          const isDirect = test.direct || (test.entityType === 'lesson' && test.entityId === lessonId);
          return (
            <article
              key={test.id}
              className={`linked-test-card${isDirect ? ' is-direct' : ''}`}
            >
              <div className="linked-test-head">
                <div>
                  <div className="linked-test-labels">
                    {isDirect ? <span className="linked-test-badge">Прив&apos;язано до уроку</span> : null}
                    <span className="linked-test-scope">
                      {ENTITY_LABEL[test.entityType]}
                    </span>
                  </div>
                  <h4>{test.title}</h4>
                  {test.description ? <p className="muted">{test.description}</p> : null}
                  <p className="linked-test-meta">
                    {test.questionCount}{' '}
                    {test.questionCount === 1 ? 'питання' : test.questionCount < 5 ? 'питання' : 'питань'}
                    {' · пароль: '}
                    <code>{test.entryPassword}</code>
                  </p>
                </div>
                <Link className="btn ghost" href={`/materials/tests/${test.id}`}>
                  Відкрити
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
