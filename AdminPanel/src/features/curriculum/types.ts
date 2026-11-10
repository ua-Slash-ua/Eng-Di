export type LessonPresentation = {
  id: number;
  originalName: string;
  url: string;
  mime: string;
  sizeBytes: number;
};

export type ContentLevel = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  courses?: { id: number }[];
};

export type ContentCourse = {
  id: number;
  levelId: number | null;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isFree?: boolean;
  unitCount?: number;
  lessonCount?: number;
  level?: { id: number; code: string; title: string } | null;
  units?: Array<{ id: number; title?: string; _count?: { lessons: number } }>;
};

export type ContentUnit = {
  id: number;
  courseId: number | null;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isFree?: boolean;
  lessonCount?: number;
  course?: {
    id: number;
    title: string;
    level?: { id: number; code: string; title: string } | null;
  } | null;
  lessons?: Array<{ id: number; title?: string }>;
  _count?: { lessons: number };
};

export type ContentLesson = {
  id: number;
  unitId: number | null;
  title: string;
  description: string | null;
  content: unknown;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isFree?: boolean;
  presentation?: LessonPresentation | null;
  linkedTests?: LinkedTest[];
  unit?: {
    id: number;
    title: string;
    course?: {
      id: number;
      title: string;
      level?: { id: number; code: string; title: string } | null;
    } | null;
  } | null;
};

export type LinkedTest = {
  id: number;
  title: string;
  description: string | null;
  entityType: 'level' | 'course' | 'unit' | 'lesson';
  entityId: number;
  questionCount: number;
  entryPassword: string;
  accessDuration: string;
  direct: boolean;
};

export type TeacherAccess = {
  id: number;
  teacherId: number;
  entityType: 'level' | 'course' | 'unit' | 'lesson';
  entityId: number;
  mode: 'readonly' | 'fork';
  grantedAt: string;
  teacher: { id: number; name: string; email: string };
  granter: { id: number; name: string };
};
