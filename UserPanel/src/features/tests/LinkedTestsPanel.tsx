'use client';

import Link from 'next/link';
import { useState } from 'react';

export type LinkedTest = {
  id: number;
  title: string;
  description: string | null;
  entityType: 'level' | 'course' | 'unit' | 'lesson';
  entityId: number;
  questionCount: number;
  unlocked: boolean;
  expiresAt: string | null;
  entryPassword?: string;
};

const ENTITY_LABEL: Record<LinkedTest['entityType'], string> = {
  level: 'Рівень',
  course: 'Курс',
  unit: 'Юніт',
  lesson: 'Урок',
};

function testPath(id: number) {
  return `/materials/tests/${id}`;
}

function fullTestUrl(id: number) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${testPath(id)}`;
  }
  return testPath(id);
}

export function LinkedTestsPanel({
  tests,
  showPassword = false,
}: {
  tests: LinkedTest[];
  showPassword?: boolean;
}) {
  const [copied, setCopied] = useState<number | null>(null);

  if (!tests.length) return null;

  async function copyText(text: string, testId: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(testId);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="dash-box linked-tests-panel">
      <header className="dash-box-head">
        <div>
          <h2>Тести до матеріалу</h2>
          <p className="muted">
            {showPassword
              ? 'Передайте учню посилання та пароль, щоб він міг пройти тест.'
              : 'Тести доступні разом із цим матеріалом.'}
          </p>
        </div>
      </header>
      <div className="linked-tests-body">
        <div className="linked-tests-list">
          {tests.map((test) => {
            const href = testPath(test.id);
            const url = fullTestUrl(test.id);
            return (
              <article key={test.id} className="linked-test-card">
                <div className="linked-test-head">
                  <div className="linked-test-copy">
                    <h3>{test.title}</h3>
                    {test.description ? <p className="muted">{test.description}</p> : null}
                    <p className="linked-test-meta">
                      {ENTITY_LABEL[test.entityType]} · {test.questionCount}{' '}
                      {test.questionCount === 1 ? 'питання' : test.questionCount < 5 ? 'питання' : 'питань'}
                      {test.unlocked ? ' · доступ відкрито' : ''}
                    </p>
                  </div>
                  {test.unlocked ? (
                    <Link className="btn linked-test-action" href={href}>
                      Пройти
                    </Link>
                  ) : (
                    <Link className="btn ghost linked-test-action" href={href}>
                      Відкрити
                    </Link>
                  )}
                </div>
                {showPassword && test.entryPassword ? (
                  <div className="linked-test-share">
                    <div className="linked-test-share-row">
                      <span className="linked-test-share-label">Посилання</span>
                      <code className="linked-test-share-value">{url}</code>
                      <button
                        type="button"
                        className="btn ghost linked-test-copy"
                        onClick={() => void copyText(url, test.id)}
                      >
                        {copied === test.id ? 'Скопійовано' : 'Копіювати'}
                      </button>
                    </div>
                    <div className="linked-test-share-row">
                      <span className="linked-test-share-label">Пароль</span>
                      <code className="linked-test-share-value">{test.entryPassword}</code>
                      <button
                        type="button"
                        className="btn ghost linked-test-copy"
                        onClick={() => void copyText(test.entryPassword!, test.id + 10000)}
                      >
                        {copied === test.id + 10000 ? 'Скопійовано' : 'Копіювати'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
