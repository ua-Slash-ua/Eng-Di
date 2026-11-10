import { api } from '@/lib/api';
import type { ContentCourse, ContentLesson, ContentLevel, ContentUnit, LessonPresentation, TeacherAccess } from './types';

const base = '/api/admin/curriculum';

export const curriculumApi = {
  // Levels
  listLevels: () => api<ContentLevel[]>(`${base}/levels`),
  getLevel: (id: number) => api<ContentLevel>(`${base}/levels/${id}`),
  createLevel: (body: { code: string; title: string; description?: string; sortOrder?: number }) =>
    api<ContentLevel>(`${base}/levels`, { method: 'POST', body: JSON.stringify(body) }),
  updateLevel: (id: number, body: unknown) =>
    api<ContentLevel>(`${base}/levels/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeLevel: (id: number) => api(`${base}/levels/${id}`, { method: 'DELETE' }),

  // Courses
  listCourses: (levelId?: number) =>
    api<ContentCourse[]>(`${base}/courses${levelId != null ? `?levelId=${levelId}` : ''}`),
  getCourse: (id: number) => api<ContentCourse>(`${base}/courses/${id}`),
  createCourse: (body: {
    levelId?: number | null;
    title: string;
    description?: string;
    sortOrder?: number;
  }) => api<ContentCourse>(`${base}/courses`, { method: 'POST', body: JSON.stringify(body) }),
  updateCourse: (id: number, body: unknown) =>
    api<ContentCourse>(`${base}/courses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeCourse: (id: number) => api(`${base}/courses/${id}`, { method: 'DELETE' }),

  // Units
  listUnits: (courseId?: number | null) =>
    api<ContentUnit[]>(`${base}/units${courseId != null ? `?courseId=${courseId}` : ''}`),
  getUnit: (id: number) => api<ContentUnit>(`${base}/units/${id}`),
  createUnit: (body: {
    courseId?: number | null;
    title: string;
    description?: string;
    sortOrder?: number;
  }) => api<ContentUnit>(`${base}/units`, { method: 'POST', body: JSON.stringify(body) }),
  updateUnit: (id: number, body: unknown) =>
    api<ContentUnit>(`${base}/units/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeUnit: (id: number) => api(`${base}/units/${id}`, { method: 'DELETE' }),

  // Content Lessons
  listLessons: (unitId?: number | null) =>
    api<ContentLesson[]>(`${base}/lessons${unitId != null ? `?unitId=${unitId}` : ''}`),
  getLesson: (id: number) => api<ContentLesson>(`${base}/lessons/${id}`),
  createLesson: (body: {
    unitId?: number | null;
    title: string;
    description?: string;
    sortOrder?: number;
  }) => api<ContentLesson>(`${base}/lessons`, { method: 'POST', body: JSON.stringify(body) }),
  updateLesson: (id: number, body: unknown) =>
    api<ContentLesson>(`${base}/lessons/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeLesson: (id: number) => api(`${base}/lessons/${id}`, { method: 'DELETE' }),
  uploadLessonPresentation: (id: number, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return api<LessonPresentation>(`${base}/lessons/${id}/presentation`, {
      method: 'POST',
      body,
    });
  },
  removeLessonPresentation: (id: number) =>
    api(`${base}/lessons/${id}/presentation`, { method: 'DELETE' }),

  // Accesses
  listAccesses: (teacherId?: number) =>
    api<TeacherAccess[]>(`${base}/accesses${teacherId ? `?teacherId=${teacherId}` : ''}`),
  grantAccess: (body: {
    teacherId: number;
    entityType: string;
    entityId: number;
    mode: 'readonly' | 'fork';
  }) => api<TeacherAccess>(`${base}/accesses`, { method: 'POST', body: JSON.stringify(body) }),
  revokeAccess: (id: number) => api(`${base}/accesses/${id}`, { method: 'DELETE' }),
};
