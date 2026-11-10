# MainApi — Curriculum

← [MainApi](./README.md)

## Файли

```
curriculum/
├── curriculum.module.ts
├── curriculum.service.ts
├── content-chain.service.ts
├── lesson-presentations.service.ts
├── teacher-library.service.ts
├── admin-curriculum.controller.ts    /api/admin/curriculum/*
├── teacher-library.controller.ts     /api/cabinet/library/*
└── dto/ (13 files)
```

---

## AdminCurriculumController — `/api/admin/curriculum`

Guards: JWT + AdminPanel + Permissions

### Levels

| Method | Path | Permission |
|--------|------|------------|
| GET | `levels` | curriculum.read |
| POST | `levels` | curriculum.write |
| GET | `levels/:id` | curriculum.read |
| PATCH | `levels/:id` | curriculum.write |
| DELETE | `levels/:id` | curriculum.delete |

### Courses

| Method | Path | Permission |
|--------|------|------------|
| GET | `courses` | curriculum.read |
| POST | `courses` | curriculum.write |
| GET | `courses/:id` | curriculum.read |
| PATCH | `courses/:id` | curriculum.write |
| DELETE | `courses/:id` | curriculum.delete |

Query `?levelId=` для фільтра.

### Units

| Method | Path | Permission |
|--------|------|------------|
| GET | `units` | curriculum.read |
| POST | `units` | curriculum.write |
| GET | `units/:id` | curriculum.read |
| PATCH | `units/:id` | curriculum.write |
| DELETE | `units/:id` | curriculum.delete |

Query `?courseId=`.

### Lessons (ContentLesson)

| Method | Path | Permission |
|--------|------|------------|
| GET | `lessons` | curriculum.read |
| POST | `lessons` | curriculum.write |
| GET | `lessons/:id` | curriculum.read |
| PATCH | `lessons/:id` | curriculum.write |
| DELETE | `lessons/:id` | curriculum.delete |
| POST | `lessons/:id/presentation` | curriculum.write | multipart upload |
| DELETE | `lessons/:id/presentation` | curriculum.write |

Query `?unitId=`.

### Access grants

| Method | Path | Permission |
|--------|------|------------|
| GET | `accesses` | curriculum.read |
| POST | `accesses` | curriculum.write |
| DELETE | `accesses/:id` | curriculum.write |

---

## TeacherLibraryController — `/api/cabinet/library`

Guards: JWT + UserPanel + **requireTeacher()** runtime check

| Method | Path | Опис |
|--------|------|------|
| GET | `/` | Full library tree for teacher |
| GET | `content/:type/:id` | Detail (level/course/unit/lesson) + linkedTests |
| GET | `lessons` | Teacher's own forked lessons |
| POST | `lessons/fork` | Fork ContentLesson → TeacherLesson |
| GET | `lessons/:id` | Own lesson detail |
| PATCH | `lessons/:id` | Update own lesson |
| DELETE | `lessons/:id` | Delete own lesson |
| GET | `units` | Teacher's own units |
| POST | `units` | Create TeacherUnit |
| PATCH | `units/:id` | Update unit |
| DELETE | `units/:id` | Delete unit |

`:type` = `level` | `course` | `unit` | `lesson`

---

## CurriculumService — методи

### Levels
| Метод | Опис |
|-------|------|
| `listLevels()` | All levels + course count |
| `findLevel(id)` | Level + courses |
| `createLevel(dto)` | code uppercase, auto sortOrder |
| `updateLevel(id, dto)` | Partial update |
| `removeLevel(id)` | Delete cascade |

### Courses
| Метод | Опис |
|-------|------|
| `listCourses(levelId?)` | With level info + unit counts |
| `findCourse(id)` | Course + units |
| `createCourse(dto)` | |
| `updateCourse(id, dto)` | Can reorder unitIds |
| `removeCourse(id)` | |

### Units
| Метод | Опис |
|-------|------|
| `listUnits(courseId?)` | With course + lesson counts |
| `findUnit(id)` | Unit + lessons |
| `createUnit(dto)` | |
| `updateUnit(id, dto)` | Can reorder lessonIds |
| `removeUnit(id)` | |

### Content lessons
| Метод | Опис |
|-------|------|
| `listLessons(unitId?)` | |
| `findLesson(id)` | With presentation |
| `createLesson(dto)` | content = JSON |
| `updateLesson(id, dto)` | |
| `removeLesson(id)` | |

### Access
| Метод | Опис |
|-------|------|
| `listAccesses(teacherId?)` | All TeacherContentAccess |
| `grantAccess(dto, granterId)` | Create grant (readonly/fork) |
| `revokeAccess(id)` | Delete grant |

---

## ContentChainService

| Метод | Опис |
|-------|------|
| `buildAccessChain(entityType, entityId)` | Array of chain links: lesson→unit→course→level |
| `buildLessonChain(lessonId)` | Chain for ContentLesson |
| `resolveScheduledLessonChain(lesson)` | Chain from scheduled Lesson (contentLessonId or teacherLessonId) |

**ContentChainLink:** `{ entityType, entityId, title, ... }`

Використовується TestsService для `listMaterialTestsForChain` — тести на unit видимі при перегляді lesson в unit.

---

## LessonPresentationsService

| Метод | Опис |
|-------|------|
| `toPublic(row)` | `{ originalName, url, mime, sizeBytes }` |
| `getForContentLesson(id)` | Get presentation |
| `uploadForContentLesson(id, file)` | Validate settings limits → save disk → upsert DB |
| `removeForContentLesson(id)` | Delete file + record |
| `copyToTeacherLesson(sourceId, teacherLessonId)` | Copy file on fork |
| `resolveScheduledMaterial(lesson)` | Resolve ContentLesson/TeacherLesson + presentation for scheduled Lesson |

**Upload path:** `uploads/presentations/{uuid}.{ext}`

**Limits:** from Settings presentation-settings (formats, maxMb).

---

## TeacherLibraryService

| Метод | Опис |
|-------|------|
| `getLibrary(teacherId)` | Tree: levels→courses→units→lessons доступні по grants |
| `getOwnLessons(teacherId)` | List TeacherLesson |
| `getOwnLesson(teacherId, id)` | Single with presentation |
| `forkLesson(teacherId, dto)` | Copy content + optional presentation |
| `updateOwnLesson(teacherId, id, dto)` | title, description, content JSON |
| `removeOwnLesson(teacherId, id)` | |
| `getOwnUnits(teacherId)` | TeacherUnit list |
| `createOwnUnit(teacherId, dto)` | |
| `updateOwnUnit(teacherId, id, dto)` | |
| `removeOwnUnit(teacherId, id)` | |
| `getContentDetail(teacherId, type, id)` | Detail + breadcrumbs + **linkedTests** + access check |

**Access check:** teacher must have grant on entity or ancestor in chain.

---

## DTOs

| DTO | Поля |
|-----|------|
| `CreateContentLevelDto` | code!, title!, description?, sortOrder? |
| `UpdateContentLevelDto` | partial |
| `CreateContentCourseDto` | levelId?, title!, description?, sortOrder? |
| `UpdateContentCourseDto` | + unitIds? |
| `CreateContentUnitDto` | courseId?, title!, description?, sortOrder? |
| `UpdateContentUnitDto` | + lessonIds? |
| `CreateContentLessonDto` | unitId?, title!, description?, content?, sortOrder? |
| `UpdateContentLessonDto` | partial |
| `GrantAccessDto` | teacherId!, entityType!, entityId!, mode! (readonly\|fork) |
| `ForkLessonDto` | sourceLessonId!, title? |
| `UpdateTeacherLessonDto` | title?, description?, content? |
| `CreateTeacherUnitDto` | sourceUnitId?, title!, mode!, lessonIds? |
| `UpdateTeacherUnitDto` | title?, mode?, lessonIds? |

---

## Prisma models (див. database/models.md)

- `ContentLevel`, `ContentCourse`, `ContentUnit`, `ContentLesson`
- `TeacherContentAccess`, `TeacherLesson`, `TeacherUnit`, `TeacherUnitLesson`
- `LessonPresentation`
