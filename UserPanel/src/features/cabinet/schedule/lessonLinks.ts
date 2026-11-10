import { teacherLessonPath, teacherStudentPath } from '../lessons/api';
import type { ScheduleLessonMark } from './api';
import type { UserPanelRole } from '@/lib/roles';

export function scheduleLessonHref(role: UserPanelRole | null, lesson: ScheduleLessonMark) {
  if (role === 'teacher') return teacherLessonPath(lesson.studentId, lesson.id);
  return '/cabinet/student/lessons';
}

export function scheduleStudentHref(lesson: ScheduleLessonMark) {
  return teacherStudentPath(lesson.studentId);
}
