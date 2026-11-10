# 07. Презентації уроків

← [Логічна](./README.md) · [Головна](../README.md)

## Призначення

До навчального **ContentLesson** (admin) або **TeacherLesson** (fork вчителя) можна прикріпити **презентацію** — PDF або PPTX файл.

Використовується на занятті: вчитель і учень відкривають файл під час уроку.

## Хто завантажує

| Джерело | Хто |
|---------|-----|
| ContentLesson | Admin в **Матеріали → Уроки → [id]** |
| TeacherLesson | Вчитель у **Бібліотека → Мій урок** |

Поле upload у формі урока (`LessonPresentationField` в admin).

## Обмеження

Налаштовуються в **Settings → Presentation settings**:

- Максимальний **розмір файлу** (bytes)
- Дозволені **MIME types** (application/pdf, pptx…)
- Можливі ліміти кількості на вчителя

При перевищенні — помилка з текстом ліміту.

## Зберігання

Файл на диску MainApi: `uploads/presentations/`

У БД `LessonPresentation`:

- originalName, url, mime, sizeBytes
- Один файл на ContentLesson **або** TeacherLesson (1:1)

Заміна файлу — upload нового, старий видаляється.

## Відображення

### Бібліотека вчителя

На сторінці матеріалу — посилання/iframe на PDF або download PPTX.

### Заняття (LessonMaterialPanel)

Коли на scheduled lesson assign content:

- `LessonPresentationsService.resolveScheduledMaterial()` визначає який lesson + presentation
- UI показує viewer або кнопку завантаження

## Assign content і презентація

Scheduled **Lesson** має `contentLessonId` або `teacherLessonId`.

При show lesson API повертає resolved material з presentation URL.

URL відносний `/uploads/...` — віддається через MainApi static або proxy.

## Типовий сценарій

1. Admin завантажує «Unit 1 — Greetings.pdf» до ContentLesson
2. Вчитель отримує grant на unit
3. На confirmed занятті assign цей урок
4. Учень відкриває заняття → бачить PDF в LessonMaterialPanel
5. Вчитель веде урок по слайдах

## Fork і своя презентація

Вчитель форкнув урок → може замінити презентацію своєю версією, не чіпаючи оригінал admin.

## Технічні деталі

→ [technical/05-database.md](../technical/05-database.md) (LessonPresentation)  
→ [technical/02-main-api.md](../technical/02-main-api.md) (LessonPresentationsService)
