import { api } from '@/lib/api';

export type ContentLessonBrief = {
  id: number;
  unitId: number | null;
  title: string;
  description: string | null;
  sortOrder: number;
  unit?: { id: number; title: string } | null;
};

export type ContentUnitBrief = {
  id: number;
  courseId: number | null;
  title: string;
  description: string | null;
  lessons: ContentLessonBrief[];
};

export type ContentCourseBrief = {
  id: number;
  levelId: number | null;
  title: string;
  units: ContentUnitBrief[];
};

export type ContentLevelBrief = {
  id: number;
  code: string;
  title: string;
  courses: ContentCourseBrief[];
};

export type TeacherAccess = {
  id: number;
  entityType: 'level' | 'course' | 'unit' | 'lesson';
  entityId: number;
  mode: 'readonly' | 'fork';
};

export type TeacherOwnLesson = {
  id: number;
  title: string;
  description: string | null;
  content: unknown;
  sourceLessonId: number | null;
  sourceLesson: { id: number; title: string } | null;
  presentation?: {
    id: number;
    originalName: string;
    url: string;
    mime: string;
    sizeBytes: number;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type TeacherUnitItem = {
  id: number;
  title: string;
  mode: 'readonly' | 'fork';
  sourceUnitId: number | null;
  createdAt: string;
  lessons: { id: number; sortOrder: number; lesson: TeacherOwnLesson }[];
};

export type LibraryResponse = {
  accesses: TeacherAccess[];
  grantedLevels: ContentLevelBrief[];
  grantedCourses: ContentCourseBrief[];
  grantedUnits: ContentUnitBrief[];
  grantedLessons: ContentLessonBrief[];
  ownLessons: TeacherOwnLesson[];
  ownUnits: TeacherUnitItem[];
};

export type LibraryBreadcrumbLevel = { id: number; code: string; title: string };
export type LibraryBreadcrumbItem = { id: number; title: string };

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

export type LibraryContentDetail =
  | {
      entityType: 'level';
      mode: 'readonly' | 'fork';
      linkedTests: LinkedTest[];
      level: { id: number; code: string; title: string; description: string | null };
      courses: { id: number; title: string; description: string | null; unitCount: number }[];
    }
  | {
      entityType: 'course';
      mode: 'readonly' | 'fork';
      linkedTests: LinkedTest[];
      level: LibraryBreadcrumbLevel | null;
      course: { id: number; title: string; description: string | null };
      units: { id: number; title: string; description: string | null; lessonCount: number }[];
    }
  | {
      entityType: 'unit';
      mode: 'readonly' | 'fork';
      linkedTests: LinkedTest[];
      level: LibraryBreadcrumbLevel | null;
      course: LibraryBreadcrumbItem | null;
      unit: { id: number; title: string; description: string | null };
      lessons: { id: number; title: string; description: string | null }[];
    }
  | {
      entityType: 'lesson';
      mode: 'readonly' | 'fork';
      linkedTests: LinkedTest[];
      level: LibraryBreadcrumbLevel | null;
      course: LibraryBreadcrumbItem | null;
      unit: LibraryBreadcrumbItem | null;
      lesson: {
        id: number;
        title: string;
        description: string | null;
        content: unknown;
        sortOrder: number;
        presentation: {
          id: number;
          originalName: string;
          url: string;
          mime: string;
          sizeBytes: number;
        } | null;
      };
    };

export type GrantedFreeTest = {
  id: number;
  title: string;
  description: string | null;
  accessDuration: string;
  questionCount: number;
  grantedAt: string;
  expiresAt: string | null;
};

export const libraryApi = {
  getLibrary: () => api<LibraryResponse>('/api/cabinet/library'),
  getContentDetail: (type: 'level' | 'course' | 'unit' | 'lesson', id: number) =>
    api<LibraryContentDetail>(`/api/cabinet/library/content/${type}/${id}`),
  getOwnLessons: () => api<TeacherOwnLesson[]>('/api/cabinet/library/lessons'),
  getOwnLesson: (id: number) => api<TeacherOwnLesson>(`/api/cabinet/library/lessons/${id}`),
  forkLesson: (sourceLessonId: number, title?: string) =>
    api<TeacherOwnLesson>('/api/cabinet/library/lessons/fork', {
      method: 'POST',
      body: JSON.stringify({ sourceLessonId, title }),
    }),
  updateLesson: (id: number, body: { title?: string; description?: string; content?: unknown }) =>
    api<TeacherOwnLesson>(`/api/cabinet/library/lessons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteLesson: (id: number) => api(`/api/cabinet/library/lessons/${id}`, { method: 'DELETE' }),

  getOwnUnits: () => api<TeacherUnitItem[]>('/api/cabinet/library/units'),
  createUnit: (body: {
    sourceUnitId?: number;
    title: string;
    mode: 'readonly' | 'fork';
    lessonIds?: number[];
  }) =>
    api<TeacherUnitItem>('/api/cabinet/library/units', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateUnit: (
    id: number,
    body: { title?: string; mode?: 'readonly' | 'fork'; lessonIds?: number[] },
  ) =>
    api<TeacherUnitItem>(`/api/cabinet/library/units/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteUnit: (id: number) => api(`/api/cabinet/library/units/${id}`, { method: 'DELETE' }),

  getGrantedTests: () => api<GrantedFreeTest[]>('/api/cabinet/tests/granted'),

  assignContent: (lessonId: number, contentLessonId?: number | null, teacherLessonId?: number | null) =>
    api(`/api/cabinet/lessons/${lessonId}/content`, {
      method: 'PATCH',
      body: JSON.stringify({ contentLessonId, teacherLessonId }),
    }),
};
