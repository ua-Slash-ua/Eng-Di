# UserPanel — Features (повний)

← [UserPanel](./README.md)

## `features/auth/`

| Component | API calls |
|-----------|-----------|
| LoginForm | useAuth().login → POST /api/auth/login |
| ForgotPasswordForm | POST /api/auth/forgot-password |
| ResetPasswordForm | POST /api/auth/reset-password |

---

## `features/home/`

| File | Exports | Purpose |
|------|---------|---------|
| loadHomePage.ts | loadHomePage(), HomePageData, HomeSection | SSR aggregator |
| HomePageView.tsx | HomePageView | Renders sections by block.type |
| HeroSection.tsx | HeroSection | Hero + stats overlay |
| LeadForm.tsx | LeadForm | POST /api/leads |

### Sections (`features/home/sections/`)

| Component | block.type |
|-----------|------------|
| AboutSection | about |
| LevelsSection | levels |
| FormatsSection | formats |
| PricingSection | pricing |
| RulesSection | rules |
| ReviewsSection + ReviewsSlider | reviews |
| HomeCtaSection | cta |

**loadHomePage** fetches: `/api/pages/home`, about-stats, formats, tariffs, rules, reviews.

---

## `features/cabinet/` — Shell

| File | Purpose |
|------|---------|
| CabinetFrame | Sidebar + mast + main; nav trail |
| CabinetMast | User bar, logout |
| CabinetRail | Icon rail items |
| StudentCabinetNav | student menu |
| TeacherCabinetNav | teacher menu |
| CabinetPage | Standard page header |
| CabinetHome | Dashboard + TodayScheduleBox |
| ProfileForm | Profile, avatar, password |
| CabinetAuthGate | Require login |
| RoleCabinetGate | Require student or teacher role |
| cabinetNavTrail.ts | sessionStorage back links |
| CabinetShell / CabinetNav | **Legacy** /cabinet/* paths |

---

## `features/cabinet/lessons/`

### api.ts — `cabinetLessonsApi`

| Method | Endpoint |
|--------|----------|
| board() | GET /api/cabinet/lessons |
| student(id) | GET .../students/:id |
| show(id) | GET .../:id |
| slots(id, from?) | GET .../:id/slots |
| propose(id, date, hour) | POST .../:id/propose |
| accept/decline/freeze/complete/miss(id) | POST .../:id/{action} |

### Types

LessonStatus, LessonActor, CabinetLesson, FreezeQuota, StudentLessonPack, TeacherLessonGroup, LinkedTest, LessonMaterial, LessonsBoard, LessonSlots

### Components

| Component | Role |
|-----------|------|
| StudentLessonsView | Student lesson list |
| StudentLessonView | Detail + material + LinkedTestsPanel |
| TeacherLessonsView | All students overview |
| TeacherStudentLessonsView | One student's pack |
| TeacherLessonView | Lesson with student |
| LessonRow / LessonTile | List UI |
| LessonSlotModal | Pick propose slot |
| LessonMaterialPanel | Presentation download/view |
| labels.ts | lessonWhen, lessonState, freezeCountLabel, … |

### Path helpers

studentLessonPath, teacherStudentPath, teacherLessonPath

---

## `features/cabinet/schedule/`

### api.ts — `cabinetScheduleApi`

| Method | Endpoint |
|--------|----------|
| week(from?) | GET /api/cabinet/schedule |
| saveWork(days, from?) | PUT .../work |
| addBusy(body, from?) | POST .../busy |
| remove(id, from?) | DELETE .../:id |

### Components

ScheduleView, ScheduleCalendar, ScheduleSettings, TimeSelect, LessonContextMenu, useScheduleLessonMenu

### hours.ts

WEEKDAYS, formatWeekRange, timeOptions, parseMinute, …

---

## `features/cabinet/class/`

**api:** cabinetClassApi.mine(), .student(id)  
**components:** TeacherClassesView

---

## `features/cabinet/library/`

### api.ts — `libraryApi`

| Method | Endpoint |
|--------|----------|
| getLibrary() | GET /api/cabinet/library |
| getContentDetail(type, id) | GET .../content/:type/:id |
| getOwnLessons/Lesson, fork, update, delete | /lessons/* |
| getOwnUnits, create, update, delete | /units/* |
| assignContent(lessonId, ...) | PATCH /api/cabinet/lessons/:id/content |

### Components

TeacherLibraryView, LibraryMaterialDetailView (+ LinkedTestsPanel), TeacherOwnLessonEditView

### paths.ts

libraryMaterialPath, libraryOwnLessonPath, libraryEntityTypeLabel

---

## `features/cabinet/tariffs/`

**api:** cabinetTariffsApi.overview(), .select(id), .cancelScheduled()  
**components:** StudentTariffsView

---

## `features/cabinet/reviews/`

**api:** reviewsApi — list, teachers, create, update, remove  
**components:** StudentReviewsView

---

## `features/tests/`

| Component | Endpoints (inline) |
|-----------|-------------------|
| TakeTestView | GET :id, POST unlock, POST attempts, POST submit |
| LinkedTestsPanel | Displays linkedTests from lesson/library API |

TakeTestView UI: one question at a time, progress bar, `.take-test` CSS scope.

---

## `features/cms-legacy/`

Legacy PageBlocks — **not used** by live HomePageView. fetchPage(slug) for old CMS.

---

## `features/cabinet/home/`

TodayScheduleBox — widget on CabinetHome
