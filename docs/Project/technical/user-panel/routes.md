# UserPanel — Routes & Layouts

← [UserPanel](./README.md)

## Public

| URL | File | Component |
|-----|------|-----------|
| `/` | app/(public)/page.tsx | HomePageView (SSR) |

Layout: `(public)/layout.tsx` — SiteHeader + SiteFooter

## Auth

| URL | Component |
|-----|-----------|
| `/login` | LoginForm |
| `/forgot-password` | ForgotPasswordForm |
| `/reset-password` | ResetPasswordForm |

Layout: `(auth)/layout.tsx` — AuthShell

## Tests (authenticated)

| URL | Component |
|-----|-----------|
| `/materials/tests/[id]` | TakeTestView |

## Cabinet redirects (legacy)

| URL | Behavior |
|-----|----------|
| `/cabinet` | Redirect by role |
| `/cabinet/profile` | Same redirect |
| `/cabinet/schedule` | Re-export redirect |
| `/cabinet/lessons` | Re-export redirect |

## Student — `/cabinet/student/*`

Layout: `student/layout.tsx` — RoleCabinetGate(student) + CabinetFrame + StudentCabinetNav

| URL | Component |
|-----|-----------|
| `/cabinet/student` | CabinetHome |
| `/cabinet/student/profile` | ProfileForm |
| `/cabinet/student/tariffs` | StudentTariffsView |
| `/cabinet/student/lessons` | StudentLessonsView |
| `/cabinet/student/lessons/[lessonId]` | StudentLessonView |
| `/cabinet/student/schedule` | ScheduleView |
| `/cabinet/student/reviews` | StudentReviewsView |

## Teacher — `/cabinet/teacher/*`

Layout: `teacher/layout.tsx` — RoleCabinetGate(teacher) + CabinetFrame + TeacherCabinetNav

| URL | Component |
|-----|-----------|
| `/cabinet/teacher` | CabinetHome |
| `/cabinet/teacher/profile` | ProfileForm |
| `/cabinet/teacher/classes` | TeacherClassesView |
| `/cabinet/teacher/lessons` | TeacherLessonsView |
| `/cabinet/teacher/lessons/[studentId]` | TeacherStudentLessonsView |
| `/cabinet/teacher/lessons/[studentId]/[lessonId]` | TeacherLessonView |
| `/cabinet/teacher/schedule` | ScheduleView |
| `/cabinet/teacher/library` | TeacherLibraryView |
| `/cabinet/teacher/library/[entityType]/[id]` | LibraryMaterialDetailView |
| `/cabinet/teacher/library/my-lessons/[id]` | TeacherOwnLessonEditView |

`entityType`: levels | courses | units | lessons

## Root layout

`app/layout.tsx`: fonts (Nunito, Baloo 2, Caveat), AuthProvider, PageAnalytics, dynamic metadata from branding.

## API proxy

`app/api/[...path]/route.ts` — same pattern as AdminPanel, panel header set client-side.
