import type {
  ContentCourse,
  ContentLesson,
  ContentLevel,
  ContentUnit,
  TeacherAccess,
} from '../types';

export type GrantTreeNode = {
  key: string;
  type: 'level' | 'course' | 'unit' | 'lesson';
  id: number;
  title: string;
  meta?: string;
  children: GrantTreeNode[];
};

const TYPE_LABELS: Record<GrantTreeNode['type'], string> = {
  level: 'Рівень',
  course: 'Курс',
  unit: 'Юніт',
  lesson: 'Урок',
};

export function entityTypeLabel(type: GrantTreeNode['type']) {
  return TYPE_LABELS[type];
}

function lessonsForUnit(unitId: number, lessons: ContentLesson[]) {
  return lessons
    .filter((item) => item.unitId === unitId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

function unitsForCourse(courseId: number, units: ContentUnit[]) {
  return units
    .filter((item) => item.courseId === courseId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

function coursesForLevel(levelId: number, courses: ContentCourse[]) {
  return courses
    .filter((item) => item.levelId === levelId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

function unitTree(unit: ContentUnit, lessons: ContentLesson[]): GrantTreeNode {
  const unitLessons = lessonsForUnit(unit.id, lessons);
  return {
    key: `unit:${unit.id}`,
    type: 'unit',
    id: unit.id,
    title: unit.title,
    meta: unitLessons.length ? `${unitLessons.length} уроків` : 'без уроків',
    children: unitLessons.map((lesson) => ({
      key: `lesson:${lesson.id}`,
      type: 'lesson',
      id: lesson.id,
      title: lesson.title,
      children: [],
    })),
  };
}

function courseTree(course: ContentCourse, units: ContentUnit[], lessons: ContentLesson[]): GrantTreeNode {
  const courseUnits = unitsForCourse(course.id, units);
  const lessonCount = courseUnits.reduce(
    (sum, unit) => sum + lessonsForUnit(unit.id, lessons).length,
    0,
  );
  return {
    key: `course:${course.id}`,
    type: 'course',
    id: course.id,
    title: course.title,
    meta: `${courseUnits.length} юн. · ${lessonCount} ур.`,
    children: courseUnits.map((unit) => unitTree(unit, lessons)),
  };
}

function levelTree(
  level: ContentLevel,
  courses: ContentCourse[],
  units: ContentUnit[],
  lessons: ContentLesson[],
): GrantTreeNode {
  const levelCourses = coursesForLevel(level.id, courses);
  const unitCount = levelCourses.reduce(
    (sum, course) => sum + unitsForCourse(course.id, units).length,
    0,
  );
  const lessonCount = levelCourses.reduce(
    (sum, course) =>
      sum +
      unitsForCourse(course.id, units).reduce(
        (inner, unit) => inner + lessonsForUnit(unit.id, lessons).length,
        0,
      ),
    0,
  );
  return {
    key: `level:${level.id}`,
    type: 'level',
    id: level.id,
    title: `${level.code} — ${level.title}`,
    meta: `${levelCourses.length} курс. · ${unitCount} юн. · ${lessonCount} ур.`,
    children: levelCourses.map((course) => courseTree(course, units, lessons)),
  };
}

export function expandAccessGrant(
  access: TeacherAccess,
  levels: ContentLevel[],
  courses: ContentCourse[],
  units: ContentUnit[],
  lessons: ContentLesson[],
): GrantTreeNode | null {
  if (access.entityType === 'level') {
    const level = levels.find((item) => item.id === access.entityId);
    if (!level) return null;
    return levelTree(level, courses, units, lessons);
  }
  if (access.entityType === 'course') {
    const course = courses.find((item) => item.id === access.entityId);
    if (!course) return null;
    return courseTree(course, units, lessons);
  }
  if (access.entityType === 'unit') {
    const unit = units.find((item) => item.id === access.entityId);
    if (!unit) return null;
    return unitTree(unit, lessons);
  }
  const lesson = lessons.find((item) => item.id === access.entityId);
  if (!lesson) return null;
  const path = [
    lesson.unit?.course?.level?.code,
    lesson.unit?.course?.title,
    lesson.unit?.title,
  ]
    .filter(Boolean)
    .join(' · ');
  return {
    key: `lesson:${lesson.id}`,
    type: 'lesson',
    id: lesson.id,
    title: lesson.title,
    meta: path || undefined,
    children: [],
  };
}

export function countTreeNodes(node: GrantTreeNode) {
  if (node.type === 'lesson') {
    return { courses: 0, units: 0, lessons: 1 };
  }
  if (node.type === 'unit') {
    return { courses: 0, units: 1, lessons: node.children.length };
  }
  if (node.type === 'course') {
    let units = 0;
    let lessons = 0;
    for (const child of node.children) {
      const nested = countTreeNodes(child);
      units += nested.units;
      lessons += nested.lessons;
    }
    return { courses: 1, units, lessons };
  }
  let units = 0;
  let lessons = 0;
  for (const child of node.children) {
    const nested = countTreeNodes(child);
    units += nested.units;
    lessons += nested.lessons;
  }
  return { courses: node.children.length, units, lessons };
}
