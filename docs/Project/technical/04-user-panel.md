# 04. UserPanel

← [Технічна](./README.md) · [Головна](../README.md)

## Стек і роль

**UserPanel** — Next.js 15, React 19. Два режими в одному застосунку:

1. **Публічний сайт** — лендинг eng-di.com
2. **Кабінет** — student / teacher після логіну

API через `/api/*` proxy з `X-EngDi-Panel: user`.

## Структура каталогів

```
UserPanel/src/
├── app/
│   ├── (public)/           — головна /
│   ├── (auth)/             — login, forgot/reset password
│   ├── cabinet/            — student + teacher layouts
│   ├── materials/tests/    — проходження тестів (публічний URL)
│   └── api/[...path]/      — proxy
├── features/
│   ├── home/               — секції лендингу
│   ├── auth/               — форми авторизації
│   ├── cabinet/            — lessons, schedule, library, profile
│   └── tests/              — TakeTestView, LinkedTestsPanel
├── components/
│   ├── site/               — SiteHeader
│   └── ui/                 — Section, SvgIcon, EyebrowTag
└── lib/                    — api, auth, roles, CMS loaders
```

## Маршрути

### Публічні

| Шлях | Компонент |
|------|-----------|
| `/` | HomePageView (SSR через loadHomePage) |
| `/login` | LoginForm |
| `/forgot-password` | ForgotPasswordForm |
| `/reset-password` | ResetPasswordForm |
| `/materials/tests/[id]` | TakeTestView (потрібен grant + пароль) |

### Кабінет (спільні)

| Шлях | Призначення |
|------|-------------|
| `/cabinet` | Redirect за роллю |
| `/cabinet/profile` | ProfileForm |
| `/cabinet/schedule` | ScheduleView (student/teacher) |
| `/cabinet/lessons` | Redirect до role-specific lessons |

### Student

| Шлях | Компонент |
|------|-----------|
| `/cabinet/student` | CabinetHome |
| `/cabinet/student/lessons` | StudentLessonsView |
| `/cabinet/student/lessons/[lessonId]` | StudentLessonView |
| `/cabinet/student/tariffs` | StudentTariffsView |
| `/cabinet/student/reviews` | StudentReviewsView |
| `/cabinet/student/profile` | ProfileForm |
| `/cabinet/student/schedule` | ScheduleView |

### Teacher

| Шлях | Компонент |
|------|-----------|
| `/cabinet/teacher` | CabinetHome |
| `/cabinet/teacher/classes` | TeacherClassesView |
| `/cabinet/teacher/lessons` | TeacherLessonsView |
| `/cabinet/teacher/lessons/[studentId]` | TeacherStudentLessonsView |
| `/cabinet/teacher/lessons/[studentId]/[lessonId]` | TeacherLessonView |
| `/cabinet/teacher/library` | TeacherLibraryView |
| `/cabinet/teacher/library/[entityType]/[id]` | LibraryMaterialDetailView |
| `/cabinet/teacher/library/my-lessons/[id]` | TeacherOwnLessonEditView |
| `/cabinet/teacher/schedule` | ScheduleView |
| `/cabinet/teacher/profile` | ProfileForm |

## Features

### home

| Файл | Призначення |
|------|-------------|
| `loadHomePage.ts` | SSR: pages, blocks, tariffs, reviews, faqs |
| `HomePageView.tsx` | Збирає секції |
| `sections/HeroSection.tsx` … `PricingSection.tsx` | Блоки лендингу |

Дані з публічного API `/api/content/*` (без auth).

### cabinet

| Файл | Призначення |
|------|-------------|
| `CabinetShell.tsx` | Layout: nav rail + frame |
| `StudentCabinetNav.tsx` / `TeacherCabinetNav.tsx` | Бокове меню |
| `lessons/StudentLessonView.tsx` | Деталі заняття учня + матеріал + linked tests |
| `lessons/TeacherLessonView.tsx` | Заняття вчителя з учнем |
| `lessons/LessonMaterialPanel.tsx` | Презентація / контент уроку |
| `schedule/ScheduleCalendar.tsx` | Календар з слотами |
| `schedule/useScheduleLessonMenu.tsx` | Контекстне меню уроку |
| `library/TeacherLibraryView.tsx` | Бібліотека матеріалів вчителя |
| `library/LibraryMaterialDetailView.tsx` | Деталі level/course/unit/lesson + linkedTests |
| `tariffs/StudentTariffsView.tsx` | Підписки та оплата |

### tests

| Файл | Призначення |
|------|-------------|
| `TakeTestView.tsx` | Одне питання за раз, progress bar, submit |
| `LinkedTestsPanel.tsx` | Тести прив'язані до матеріалу (teacher: link+password; student: take) |

## Lib

| Файл | Призначення |
|------|-------------|
| `lib/api.ts` | `api()` з panel=user, auto refresh |
| `lib/auth.tsx` | AuthProvider |
| `lib/roles.ts` | `canAccessUserPanel`, `cabinetBasePath(role)` |
| `lib/blocks.ts`, `lib/tariffs.ts` … | Loaders для SSR публічного контенту |

## Стилі

`app/globals.css` — глобальні стилі сайту та кабінету. Клас `.take-test` ізолює стилі тестів (fix для `input { width: 100% }`).

## Proxy і SSR

- Client components: `fetch('/api/...')` через browser
- SSR (home): `API_INTERNAL_URL` для server-side fetch до MainApi

## Dev

```bash
cd UserPanel
npm run dev   # порт 3000
```

## Production нюанс

При деплої потрібно завантажувати **повну** папку `.next` після `npm run build`. Неповний upload дає 404 на `_next/static/chunks/*` (hash mismatch).

## Зв'язок

Логіка кабінету — [logical/](../logical/README.md). API — [02-main-api.md](./02-main-api.md).
