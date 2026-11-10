export type TestKind = 'free' | 'material';
export type TestAccessDuration = 'm1' | 'm5' | 'm15' | 'h1' | 'forever';
export type TestAnswerKind = 'choice' | 'write_in';
export type ContentEntityType = 'level' | 'course' | 'unit' | 'lesson';
export type TestAttemptStatus = 'in_progress' | 'submitted' | 'expired';

export type TestAnswerOption = {
  id?: number;
  text: string;
  kind: TestAnswerKind;
  isCorrect: boolean;
  sortOrder: number;
};

export type TestQuestion = {
  id?: number;
  prompt: string;
  sortOrder: number;
  options: TestAnswerOption[];
};

export type TestItem = {
  id: number;
  title: string;
  description: string | null;
  kind: TestKind;
  entityType: ContentEntityType | null;
  entityId: number | null;
  accessDuration: TestAccessDuration;
  entryPassword: string;
  randomize: boolean;
  maxAttempts: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  questions?: TestQuestion[];
  _count?: { questions: number; attempts: number };
};

export type TestAttemptQuotaUser = {
  userId: number;
  name: string;
  email: string;
  attemptsUsed: number;
  extraAttempts: number;
  attemptsLimit: number;
  attemptsRemaining: number;
  updatedAt: string | null;
};

export type TestAttemptQuotasPayload = {
  maxAttempts: number;
  maxExtraAttempts: number;
  users: TestAttemptQuotaUser[];
};

export type TestStats = {
  totalAttempts: number;
  submittedAttempts: number;
  uniqueUsers: number;
  avgScore: number | null;
  completionRate: number;
};

export type TestAttemptRow = {
  id: number;
  status: TestAttemptStatus;
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
  user: { id: number; name: string; email: string; userRole: string | null };
};

export type TestAttemptReview = {
  id: number;
  testId: number;
  testTitle: string;
  status: TestAttemptStatus;
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
  user?: { id: number; name: string; email: string; userRole: string | null };
  review: Array<{
    questionId: number;
    prompt: string;
    isCorrect: boolean;
    selectedOptionIds: number[];
    writtenText: string | null;
    options: Array<{
      id: number;
      text: string;
      kind: TestAnswerKind;
      isCorrect: boolean;
      selected: boolean;
    }>;
  }>;
};

export const DURATION_LABELS: Record<TestAccessDuration, string> = {
  m1: '1 хвилина',
  m5: '5 хвилин',
  m15: '15 хвилин',
  h1: '1 година',
  forever: 'Назавжди',
};

export const KIND_LABELS: Record<TestKind, string> = {
  free: 'Вільний',
  material: 'Для матеріалу',
};
