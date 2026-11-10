export type LibraryEntityType = 'levels' | 'courses' | 'units' | 'lessons';
export type LibraryAudience = 'teacher' | 'student';

export function libraryMaterialPath(
  type: LibraryEntityType,
  id: number,
  audience: LibraryAudience = 'teacher',
) {
  if (audience === 'student') {
    return `/cabinet/student/materials/${type}/${id}`;
  }
  return `/cabinet/teacher/library/${type}/${id}`;
}

export function libraryHomePath(audience: LibraryAudience = 'teacher') {
  return audience === 'student' ? '/cabinet/student/materials' : '/cabinet/teacher/library';
}

export function libraryOwnLessonPath(id: number) {
  return `/cabinet/teacher/library/my-lessons/${id}`;
}

export function libraryEntityTypeLabel(type: LibraryEntityType) {
  switch (type) {
    case 'levels':
      return 'Рівень';
    case 'courses':
      return 'Курс';
    case 'units':
      return 'Юніт';
    case 'lessons':
      return 'Урок';
  }
}
