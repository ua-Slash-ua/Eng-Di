'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateButton, type CreateModalControl } from '@/components/ui/CreateButton';
import { faqsApi } from '../api';

type CreateFaqButtonProps = {
  variant?: 'primary' | 'outline';
  /** Runs instead of opening the freshly created question. */
  onCreated?: () => void;
} & CreateModalControl;

export function CreateFaqButton({ variant, onCreated, hideTrigger, open, onOpenChange }: CreateFaqButtonProps) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  function reset() {
    setQuestion('');
    setAnswer('');
  }

  async function onCreate() {
    const created = await faqsApi.create({ question, answer });
    reset();
    if (onCreated) {
      onCreated();
    } else {
      router.push(`/faq/${created.id}`);
    }
  }

  return (
    <CreateButton
      label="Нове питання"
      modalTitle="Нове питання"
      variant={variant}
      onCreate={onCreate}
      onOpen={reset}
      hideTrigger={hideTrigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <label htmlFor="new-faq-question">Питання</label>
      <input
        id="new-faq-question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        required
        minLength={2}
        maxLength={220}
        placeholder="Як проходить пробне заняття?"
      />
      <label htmlFor="new-faq-answer">Відповідь</label>
      <textarea
        id="new-faq-answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        required
        minLength={2}
        maxLength={600}
        rows={4}
      />
    </CreateButton>
  );
}
