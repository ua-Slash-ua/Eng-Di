'use client';

import Link from 'next/link';
import type { GrantedFreeTest } from './api';

function questionLabel(count: number) {
  if (count === 1) return 'питання';
  if (count < 5) return 'питання';
  return 'питань';
}

export function GrantedTestsList({
  tests,
  emptyHint = 'Адміністратор може видати доступ до вільного тесту у вкладці «Доступи».',
}: {
  tests: GrantedFreeTest[];
  emptyHint?: string;
}) {
  if (!tests.length) {
    return (
      <div className="dash-box library-empty">
        <div className="library-empty-body">
          <p>Поки немає присвоєних тестів.</p>
          <p className="muted">{emptyHint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="library-own-list">
      {tests.map((test) => (
        <div key={test.id} className="dash-box library-own-card">
          <Link
            href={`/materials/tests/${test.id}`}
            className="library-lesson-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="library-lesson-title">{test.title}</div>
            {test.description ? <div className="library-lesson-desc">{test.description}</div> : null}
            <div className="library-lesson-desc muted">
              {test.questionCount} {questionLabel(test.questionCount)}
            </div>
          </Link>
          <Link
            href={`/materials/tests/${test.id}`}
            className="btn ghost library-lesson-action"
            target="_blank"
            rel="noopener noreferrer"
          >
            Відкрити
          </Link>
        </div>
      ))}
    </div>
  );
}
