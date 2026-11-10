import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { csvEnum, textFilter } from '../common/filters';
import { PrismaService } from '../prisma/prisma.service';
import { formatLessonWhen, personVars, type MailPerson } from './mail-vars';
import { MailingsMailerService } from './mailings.mailer';
import {
  CRON_MAILING_KIND_LABELS,
  CRON_MAILING_KINDS,
  MAILING_TASK_STATUS_LABELS,
  MAILING_TASK_STATUSES,
  type CronMailingKind,
  type MailingTaskStatus,
  type MailingType,
} from './mailing.types';

const LESSON_REMINDER_KIND: CronMailingKind = 'lesson_reminder';
const REMINDER_LEAD_MS = 60 * 60 * 1000;
const STALE_CLAIM_MS = 10 * 60 * 1000;
const OPEN_TASK_STATUSES: MailingTaskStatus[] = ['pending', 'claimed', 'cancelled'];

export type MailingTaskListQuery = {
  q?: string;
  kind?: string;
  status?: string;
  email?: string;
  user?: string;
  page?: number;
  limit?: number;
};

export type MailingCronRunListQuery = {
  status?: string;
  page?: number;
  limit?: number;
};

const CRON_RUN_STATUSES = ['ok', 'error', 'running'] as const;

type LessonForReminder = {
  id: number;
  number: number;
  status: string;
  startsAt: Date | null;
  reminderSentAt: Date | null;
  student: MailPerson & { email: string };
  teacher: (MailPerson & { email: string }) | null;
};

@Injectable()
export class MailingTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailingsMailerService,
  ) {}

  async syncLesson(lessonId: number) {
    const lesson = await this.loadLesson(lessonId);
    if (!lesson) return { enqueued: 0, cancelled: 0 };
    if (lesson.status === 'confirmed' && lesson.startsAt && lesson.startsAt.getTime() > Date.now()) {
      const enqueued = await this.enqueueLessonReminder(lesson);
      return { enqueued, cancelled: 0 };
    }
    const cancelled = await this.cancelLesson(lesson.id, cancelReason(lesson.status));
    return { enqueued: 0, cancelled };
  }

  async cancelLesson(lessonId: number, reason: string) {
    const result = await this.prisma.mailingTask.updateMany({
      where: { lessonId, kind: LESSON_REMINDER_KIND, status: { in: ['pending', 'claimed'] } },
      data: {
        status: 'cancelled',
        error: reason.slice(0, 500),
        processedAt: new Date(),
        claimedAt: null,
      },
    });
    return result.count;
  }

  async tick() {
    const run = await this.prisma.mailingCronRun.create({
      data: {
        action: 'mailing_worker',
        status: 'running',
        startedAt: new Date(),
      },
    });
    const counts = { scanned: 0, enqueued: 0, cancelled: 0, claimed: 0, sent: 0, skipped: 0, failed: 0, overdue: 0 };
    try {
      await this.releaseStaleClaims();
      const synced = await this.syncConfirmedLessons();
      counts.scanned = synced.scanned;
      counts.enqueued = synced.enqueued;
      counts.cancelled = synced.cancelled;
      const processed = await this.processDue(run.id);
      counts.claimed = processed.claimed;
      counts.sent = processed.sent;
      counts.skipped = processed.skipped;
      counts.failed = processed.failed;
      counts.overdue = await this.prisma.mailingTask.count({
        where: { status: 'pending', scheduledAt: { lt: new Date() } },
      });
      await this.prisma.mailingCronRun.update({
        where: { id: run.id },
        data: {
          status: 'ok',
          finishedAt: new Date(),
          ...counts,
        },
      });
      return { id: run.id, ...counts };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      await this.prisma.mailingCronRun.update({
        where: { id: run.id },
        data: {
          status: 'error',
          finishedAt: new Date(),
          ...counts,
          error: message.slice(0, 500),
        },
      });
      throw error;
    }
  }

  async listTasks(query: MailingTaskListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 10));
    const and: Prisma.MailingTaskWhereInput[] = [];

    const kinds = csvEnum(query.kind, CRON_MAILING_KINDS);
    if (kinds) and.push({ kind: { in: kinds } });

    const statuses = csvEnum(query.status, MAILING_TASK_STATUSES);
    if (statuses) and.push({ status: { in: statuses } });

    const email = textFilter(query.email);
    if (email) and.push({ email: { contains: email } });

    const user = textFilter(query.user);
    if (user) {
      and.push({
        OR: [
          { user: { name: { contains: user } } },
          { user: { email: { contains: user } } },
          { user: { firstName: { contains: user } } },
          { user: { lastName: { contains: user } } },
        ],
      });
    }

    const q = query.q?.trim();
    if (q) {
      and.push({
        OR: [{ email: { contains: q } }, { reason: { contains: q } }, { user: { name: { contains: q } } }],
      });
    }

    const where: Prisma.MailingTaskWhereInput = and.length ? { AND: and } : {};
    const now = Date.now();
    const [rows, total] = await Promise.all([
      this.prisma.mailingTask.findMany({
        where,
        orderBy: [{ scheduledAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          lesson: { select: { id: true, number: true, status: true, startsAt: true } },
        },
      }),
      this.prisma.mailingTask.count({ where }),
    ]);

    return {
      tasks: rows.map((row) => {
        const status = row.status as MailingTaskStatus;
        const overdue = status === 'pending' && row.scheduledAt.getTime() < now;
        return {
          id: row.id,
          kind: row.kind,
          kindLabel: CRON_MAILING_KIND_LABELS[row.kind as CronMailingKind] || row.kind,
          mailingType: row.mailingType,
          audience: row.audience,
          audienceLabel: row.audience === 'teacher' ? 'Учитель' : 'Учень',
          status,
          statusLabel: overdue ? 'Прострочено' : MAILING_TASK_STATUS_LABELS[status] || row.status,
          overdue,
          scheduledAt: row.scheduledAt.toISOString(),
          processedAt: row.processedAt?.toISOString() ?? null,
          email: row.email,
          reason: row.reason,
          error: row.error,
          errorRaw: row.errorRaw,
          mailingLogId: row.mailingLogId,
          createdAt: row.createdAt.toISOString(),
          user: row.user,
          lesson: row.lesson
            ? {
                id: row.lesson.id,
                number: row.lesson.number,
                status: row.lesson.status,
                startsAt: row.lesson.startsAt?.toISOString() ?? null,
              }
            : null,
        };
      }),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listCronRuns(query: MailingCronRunListQuery = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 10));
    const statuses = csvEnum(query.status, CRON_RUN_STATUSES);
    const where: Prisma.MailingCronRunWhereInput = statuses ? { status: { in: statuses } } : {};
    const [rows, total] = await Promise.all([
      this.prisma.mailingCronRun.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mailingCronRun.count({ where }),
    ]);
    return {
      runs: rows.map((row) => ({
        id: row.id,
        action: row.action,
        actionLabel: row.action === 'mailing_worker' ? 'Воркер розсилок' : row.action,
        status: row.status,
        statusLabel: row.status === 'ok' ? 'Ок' : row.status === 'error' ? 'Помилка' : 'В роботі',
        startedAt: row.startedAt.toISOString(),
        finishedAt: row.finishedAt?.toISOString() ?? null,
        scanned: row.scanned,
        enqueued: row.enqueued,
        cancelled: row.cancelled,
        claimed: row.claimed,
        sent: row.sent,
        skipped: row.skipped,
        failed: row.failed,
        overdue: row.overdue,
        error: row.error,
      })),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private async syncConfirmedLessons() {
    const lessons = await this.prisma.lesson.findMany({
      where: {
        status: 'confirmed',
        startsAt: { gt: new Date() },
        reminderSentAt: null,
      },
      include: lessonPeople,
      take: 200,
    });
    let enqueued = 0;
    for (const lesson of lessons) {
      enqueued += await this.enqueueLessonReminder(lesson);
    }
    const stale = await this.prisma.mailingTask.findMany({
      where: { kind: LESSON_REMINDER_KIND, status: { in: ['pending', 'claimed'] } },
      select: { id: true, lessonId: true, lesson: { select: { status: true, startsAt: true } } },
      take: 300,
    });
    let cancelled = 0;
    for (const task of stale) {
      const lesson = task.lesson;
      const stillDue = lesson?.status === 'confirmed' && lesson.startsAt && lesson.startsAt.getTime() > Date.now();
      if (stillDue) continue;
      cancelled += await this.prisma.mailingTask
        .updateMany({
          where: { id: task.id, status: { in: ['pending', 'claimed'] } },
          data: {
            status: 'cancelled',
            error: cancelReason(lesson?.status).slice(0, 500),
            processedAt: new Date(),
            claimedAt: null,
          },
        })
        .then((row) => row.count);
    }
    return { scanned: lessons.length, enqueued, cancelled };
  }

  private async enqueueLessonReminder(lesson: LessonForReminder) {
    if (!lesson.startsAt) return 0;
    const scheduledAt = new Date(lesson.startsAt.getTime() - REMINDER_LEAD_MS);
    const startsAt = formatLessonWhen(lesson.startsAt);
    const teacherName = lesson.teacher?.name || 'викладач';
    const studentName = lesson.student.name;
    const parties: Array<{ audience: 'student' | 'teacher'; user: MailPerson & { email: string } }> = [
      { audience: 'student', user: lesson.student },
    ];
    if (lesson.teacher?.email) {
      parties.push({ audience: 'teacher', user: lesson.teacher });
    }

    let created = 0;
    for (const party of parties) {
      if (!party.user.email) continue;
      const payload = {
        ...personVars(party.user),
        lesson_number: String(lesson.number),
        teacher_name: teacherName,
        student_name: studentName,
        counterpart_name: party.audience === 'student' ? teacherName : studentName,
        starts_at: startsAt,
        startsAtIso: lesson.startsAt.toISOString(),
        cabinet_url: this.mailer.cabinetUrl(party.audience),
      };
      const reason =
        party.audience === 'teacher'
          ? `Нагадування вчителю за годину до уроку №${lesson.number}`
          : `Нагадування учню за годину до уроку №${lesson.number}`;
      const existing = await this.prisma.mailingTask.findFirst({
        where: { kind: LESSON_REMINDER_KIND, lessonId: lesson.id, userId: party.user.id },
      });
      if (existing && !OPEN_TASK_STATUSES.includes(existing.status as MailingTaskStatus)) {
        continue;
      }
      if (existing) {
        await this.prisma.mailingTask.update({
          where: { id: existing.id },
          data: {
            status: 'pending',
            scheduledAt,
            email: party.user.email.trim().toLowerCase(),
            reason,
            payload,
            error: null,
            errorRaw: null,
            claimedAt: null,
            processedAt: null,
            mailingLogId: null,
          },
        });
      } else {
        await this.prisma.mailingTask.create({
          data: {
            kind: LESSON_REMINDER_KIND,
            mailingType: 'lesson_reminder',
            audience: party.audience,
            status: 'pending',
            scheduledAt,
            email: party.user.email.trim().toLowerCase(),
            userId: party.user.id,
            lessonId: lesson.id,
            reason,
            payload,
          },
        });
        created += 1;
      }
    }
    return created;
  }

  private async processDue(cronRunId: number) {
    const due = await this.prisma.mailingTask.findMany({
      where: { status: 'pending', scheduledAt: { lte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
      take: 40,
    });
    const counts = { claimed: 0, sent: 0, skipped: 0, failed: 0 };
    for (const task of due) {
      const claimed = await this.prisma.mailingTask.updateMany({
        where: { id: task.id, status: 'pending' },
        data: { status: 'claimed', claimedAt: new Date(), cronRunId },
      });
      if (claimed.count !== 1) continue;
      counts.claimed += 1;
      const payload = asVars(task.payload);
      const result = await this.mailer.sendToUser(
        task.mailingType as MailingType,
        {
          id: task.userId ?? 0,
          email: task.email,
          name: payload.name || task.email,
          firstName: payload.first_name,
        },
        payload,
      );
      const nextStatus = result?.status ?? 'skipped';
      await this.prisma.mailingTask.update({
        where: { id: task.id },
        data: {
          status: nextStatus,
          mailingLogId: result?.logId ?? null,
          error: result?.errorParsed ?? (result ? null : 'Немає email одержувача'),
          errorRaw: result?.errorRaw ?? null,
          processedAt: new Date(),
        },
      });
      if (nextStatus === 'sent') {
        counts.sent += 1;
        if (task.lessonId) {
          await this.prisma.lesson.updateMany({
            where: { id: task.lessonId, reminderSentAt: null },
            data: { reminderSentAt: new Date() },
          });
        }
      } else if (nextStatus === 'skipped') {
        counts.skipped += 1;
      } else {
        counts.failed += 1;
      }
    }
    return counts;
  }

  private async releaseStaleClaims() {
    const staleAt = new Date(Date.now() - STALE_CLAIM_MS);
    await this.prisma.mailingTask.updateMany({
      where: { status: 'claimed', claimedAt: { lt: staleAt } },
      data: { status: 'pending', claimedAt: null },
    });
  }

  private async loadLesson(lessonId: number): Promise<LessonForReminder | null> {
    return this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: lessonPeople,
    });
  }
}

const lessonPeople = {
  student: {
    select: { id: true, email: true, name: true, firstName: true, lastName: true, middleName: true },
  },
  teacher: {
    select: { id: true, email: true, name: true, firstName: true, lastName: true, middleName: true },
  },
} as const;

function cancelReason(status?: string | null) {
  if (status === 'frozen') return 'Урок заморожено. Нагадування скасовано.';
  if (status === 'unscheduled') return 'Час уроку скасовано. Нагадування скасовано.';
  if (status === 'cancelled') return 'Урок скасовано. Нагадування скасовано.';
  if (status === 'proposed' || status === 'rescheduling') return 'Урок знову на узгодженні. Нагадування скасовано.';
  if (status === 'done') return 'Урок уже відбувся. Нагадування скасовано.';
  if (status === 'missed') return 'Учень пропустив урок. Нагадування скасовано.';
  if (status === 'admin_skip') return 'Адміністратор позначив пропуск. Нагадування скасовано.';
  return 'Нагадування скасовано, бо урок більше не підтверджений.';
}

function asVars(payload: Prisma.JsonValue): Record<string, string> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') next[key] = value;
  }
  return next;
}
