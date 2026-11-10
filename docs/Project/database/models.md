# База даних — моделі (повний довідник)

← [Технічна](../README.md) · [Головна](../../README.md)

Schema: `MainApi/prisma/schema.prisma` · MySQL

---

## User

| Поле | Тип | Опис |
|------|-----|------|
| id | Int PK | |
| email | String unique | Login |
| passwordHash | String | bcrypt |
| name | String | Display name |
| firstName, lastName, middleName | String? | ПІБ |
| birthDate | Date? | |
| phone | String? | |
| avatarUrl | String? | /uploads/avatars/... |
| userRole | UserPanelRole? | student \| teacher |
| teacherId | Int? FK User | Учень → вчитель |
| isSuperAdmin | Boolean | Full admin access |
| status | UserStatus | active \| blocked |
| adminRoleId | Int? FK AdminRole | RBAC |
| activatedAt | DateTime? | First login |
| pendingPassword | String? | Temp password plain (until activate) |
| createdAt, updatedAt | DateTime | |

Relations: students[], sessions[], tariffs[], studentLessons[], teacherLessons[], teacherAccesses[], testAttempts[], reviews...

---

## AuthSession

| Поле | Тип | Опис |
|------|-----|------|
| userId | FK User | |
| familyId | String UUID | Token family for rotation |
| refreshTokenHash | String unique | SHA-256 |
| panel | AuthPanel | user \| admin |
| ip, userAgent | String? | |
| expiresAt | DateTime | |
| revokedAt, revokedReason | | |
| replacedById | Int? | Rotation chain |

---

## AuthEvent

| Поле | Тип | Опис |
|------|-----|------|
| type | AuthEventType | LOGIN_SUCCESS, PAGE_VIEW, … |
| panel | AuthPanel? | |
| path | String? | For PAGE_VIEW |
| meta | Json? | Extra context |

---

## Permission / AdminRole / AdminRolePermission

Permission: key (unique), resource, action, label, groupLabel  
AdminRole: name, slug, description, isSystem  
M2M via AdminRolePermission

---

## Page / PageSeo / PageSection / Block / BlockMeta

**Page:** slug unique, title  
**PageSeo:** title, description, keywords  
**PageSection:** pageId + blockId + sortOrder (reusable blocks on page)  
**Block:** type (hero, about, …), name, plaque, title  
**BlockMeta:** key-value pairs for block config  
**PageBlock:** legacy embedded blocks (BlockType enum)

---

## Lead / LeadCategory

Lead: name, phone, email?, message?, status (NEW/IN_PROGRESS/DONE), location?, categoryId?

---

## AboutStat / AboutStatCategory

Stat: value, label, icon (SVG text), sortOrder, categoryId

---

## Format

title, description, icon, accent (1-N), sortOrder

---

## Tariff

| Поле | Опис |
|------|------|
| lessons | Count in package |
| price, oldPrice | UAH |
| popular | Highlight flag |
| note | Subtitle |
| variant | Card style (start, …) |
| lessonPrice | Per-lesson display |
| paymentMode | once \| installments |
| installmentCount | Parts |
| durationMonths | Subscription length |
| frozenLessonsPerMonth | Freeze quota |

---

## UserTariff / UserTariffPayment

UserTariff: userId, tariffId, status (active/scheduled/expired/cancelled), startsAt, endsAt  
UserTariffPayment: partNumber, lessons, amount, paidAt — unique (userTariffId, partNumber)

---

## Lesson (scheduled)

| Поле | Опис |
|------|------|
| studentId, teacherId | |
| userTariffId, paymentId | Source package/part |
| number | Lesson # in tariff (unique per tariff) |
| status | LessonStatus enum |
| proposedBy | teacher \| student |
| startsAt, endsAt | UTC slot |
| frozenAt, refundedAt, reminderSentAt | |
| contentLessonId, teacherLessonId | Assigned material |

---

## ContentLevel → ContentCourse → ContentUnit → ContentLesson

Standard hierarchy. Each has title, description?, sortOrder.  
ContentLevel.code unique (A1, B2).  
ContentLesson.content = Json (rich content blocks).

---

## TeacherContentAccess

teacherId, entityType (level/course/unit/lesson), entityId, mode (readonly/fork), grantedBy, grantedAt  
Unique: (teacherId, entityType, entityId)

---

## TeacherLesson / TeacherUnit / TeacherUnitLesson

Fork copies by teacher. TeacherLesson: sourceLessonId?, content Json.  
TeacherUnitLesson: sort order of lessons in unit.

---

## LessonPresentation

One per ContentLesson OR TeacherLesson. originalName, url, mime, sizeBytes.

---

## Test / TestQuestion / TestAnswerOption

Test: kind, entityType+entityId (material), accessDuration, entryPassword, randomize  
Question: prompt, sortOrder  
Option: text, kind (choice/write_in), isCorrect

---

## TestAccessGrant / TestAttempt / TestAttemptAnswer

Grant: userId+testId unique, expiresAt?  
Attempt: status, score, orderSnapshot Json  
Answer: selectedOptionIds Json, writtenText, isCorrect

---

## ScheduleRule

userId, kind (work/busy), scope (weekly/date/daily), weekday?, date?, startMinute, endMinute

---

## Review

quote, author, result, rating, kind (manual/user), target (school/teacher), userId?, teacherId?, isVerified

---

## Faq / SchoolRule / Icon / IconGroup / Setting

Faq: question, answer, sortOrder  
SchoolRule: title, description, accent, sortOrder  
Icon: name, slug, type (svg/image/video), svg/url, groupId  
Setting: key unique, value Json

---

## MailingLog / MailingTask / MailingCronRun

Log: type, email, status, error, messageId  
Task: kind, mailingType, audience, status, scheduledAt, payload Json, lessonId?  
Unique task: (kind, lessonId, userId)  
CronRun: scanned, enqueued, sent, failed counts

---

## PasswordResetToken

tokenHash unique, expiresAt, usedAt

---

## Enum reference

Див. також [technical/05-database.md](../05-database.md) для ER-діаграми.
