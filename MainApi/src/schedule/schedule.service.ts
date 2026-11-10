import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ScheduleRule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBusyDto } from './dto/create-busy.dto';
import type { SaveWorkDto } from './dto/save-work.dto';

export const HOUR_FROM = 6;
export const HOUR_TO = 22;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function ymd(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseYmd(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function isoWeekday(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function mondayOf(date: Date) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() - (isoWeekday(next) - 1));
  return next;
}

function coversHour(startMinute: number, endMinute: number, hour: number) {
  const from = hour * 60;
  const to = from + 60;
  return startMinute < to && endMinute > from;
}

function ymdUtc(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function weekUtcRange(weekStart: Date) {
  const from = new Date(Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 0, 0, 0));
  const to = new Date(Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7, 0, 0, 0));
  return { from, to };
}

function toPublicRule(row: ScheduleRule) {
  return {
    id: row.id,
    kind: row.kind,
    scope: row.scope,
    weekday: row.weekday,
    date: row.date ? ymd(row.date) : null,
    startMinute: row.startMinute,
    endMinute: row.endMinute,
  };
}

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: number, from?: string) {
    const start = parseYmd(from ?? '') ?? mondayOf(new Date());
    const weekStart = mondayOf(start);
    const { from: weekFrom, to: weekTo } = weekUtcRange(weekStart);
    const [rules, lessonRows] = await Promise.all([
      this.prisma.scheduleRule.findMany({
        where: { userId },
        orderBy: [{ kind: 'asc' }, { weekday: 'asc' }, { startMinute: 'asc' }],
      }),
      this.prisma.lesson.findMany({
        where: {
          status: { in: ['proposed', 'rescheduling', 'confirmed', 'done', 'missed'] },
          startsAt: { gte: weekFrom, lt: weekTo },
          OR: [{ studentId: userId }, { teacherId: userId }],
        },
        include: {
          student: { select: { id: true, name: true } },
          teacher: { select: { name: true } },
        },
      }),
    ]);
    const work = rules.filter((row) => row.kind === 'work');
    const busy = rules.filter((row) => row.kind === 'busy');
    const lessons = new Map<
      string,
      {
        id: number;
        number: number;
        status: string;
        with: string;
        studentId: number;
        proposedBy: string | null;
        waitingOn: string | null;
        canStudentReschedule: boolean;
      }
    >();
    for (const row of lessonRows) {
      if (!row.startsAt) continue;
      const dateKey = ymdUtc(row.startsAt);
      const hour = row.startsAt.getUTCHours();
      const counterpart = row.studentId === userId ? (row.teacher?.name ?? '') : row.student.name;
      const negotiating = row.status === 'proposed' || row.status === 'rescheduling';
      lessons.set(`${dateKey}-${hour}`, {
        id: row.id,
        number: row.number,
        status: row.status,
        with: counterpart,
        studentId: row.studentId,
        proposedBy: row.proposedBy,
        waitingOn: negotiating ? (row.proposedBy === 'teacher' ? 'student' : 'teacher') : null,
        canStudentReschedule:
          row.status === 'confirmed' && row.startsAt.getTime() > Date.now(),
      });
    }
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dateKey = ymd(date);
      const weekday = isoWeekday(date);
      const hours = [];
      for (let hour = HOUR_FROM; hour < HOUR_TO; hour += 1) {
        const lesson = lessons.get(`${dateKey}-${hour}`);
        hours.push({
          hour,
          state: lesson
            ? lesson.status === 'proposed' || lesson.status === 'rescheduling'
              ? 'proposed'
              : 'lesson'
            : this.hourState(hour, weekday, dateKey, work, busy),
          lesson: lesson ?? null,
        });
      }
      return { date: dateKey, weekday, hours };
    });
    return {
      from: ymd(weekStart),
      hourFrom: HOUR_FROM,
      hourTo: HOUR_TO,
      days,
      work: work.map(toPublicRule),
      busy: busy.map(toPublicRule),
    };
  }

  async saveWork(userId: number, dto: SaveWorkDto, from?: string) {
    const seen = new Set<number>();
    for (const day of dto.days) {
      if (seen.has(day.weekday)) {
        throw new BadRequestException('Кожен день тижня має бути один раз');
      }
      seen.add(day.weekday);
      if (!day.off && day.endMinute <= day.startMinute) {
        throw new BadRequestException('Час завершення має бути пізніше за початок');
      }
    }
    if (seen.size !== 7) {
      throw new BadRequestException('Вкажіть усі дні тижня');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.scheduleRule.deleteMany({ where: { userId, kind: 'work' } });
      const rows = dto.days.map((day) => ({
          userId,
          kind: 'work' as const,
          scope: 'weekly' as const,
          weekday: day.weekday,
          date: null,
          startMinute: day.off ? 0 : day.startMinute,
          endMinute: day.off ? 0 : day.endMinute,
        }));
      await tx.scheduleRule.createMany({ data: rows });
    });
    return this.overview(userId, from);
  }

  async addBusy(userId: number, dto: CreateBusyDto, from?: string) {
    if (dto.endMinute <= dto.startMinute) {
      throw new BadRequestException('Час завершення має бути пізніше за початок');
    }
    if (dto.scope === 'weekly' && !dto.weekday) {
      throw new BadRequestException('Оберіть день тижня');
    }
    const date = dto.scope === 'date' ? parseYmd(dto.date ?? '') : null;
    if (dto.scope === 'date' && !date) {
      throw new BadRequestException('Оберіть дату');
    }
    await this.prisma.scheduleRule.create({
      data: {
        userId,
        kind: 'busy',
        scope: dto.scope,
        weekday: dto.scope === 'weekly' ? dto.weekday ?? null : null,
        date,
        startMinute: dto.startMinute,
        endMinute: dto.endMinute,
      },
    });
    return this.overview(userId, from);
  }

  async removeRule(userId: number, id: number, from?: string) {
    const row = await this.prisma.scheduleRule.findFirst({ where: { id, userId } });
    if (!row) {
      throw new NotFoundException('Правило не знайдено');
    }
    await this.prisma.scheduleRule.delete({ where: { id } });
    return this.overview(userId, from);
  }

  private hourState(
    hour: number,
    weekday: number,
    dateKey: string,
    work: ScheduleRule[],
    busy: ScheduleRule[],
  ): 'free' | 'off' | 'busy' {
    const busyHit = busy.some((row) => {
      if (!coversHour(row.startMinute, row.endMinute, hour)) return false;
      if (row.scope === 'daily') return true;
      if (row.scope === 'date') return row.date ? ymd(row.date) === dateKey : false;
      return row.weekday === weekday;
    });
    if (busyHit) return 'busy';

    if (!work.length) return 'free';
    const workHit = work.some(
      (row) => row.weekday === weekday && coversHour(row.startMinute, row.endMinute, hour),
    );
    return workHit ? 'free' : 'off';
  }
}
