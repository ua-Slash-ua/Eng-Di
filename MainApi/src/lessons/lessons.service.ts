import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Lesson, LessonActor, LessonStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailingsMailerService } from '../mailings/mailings.mailer';
import { MailingTasksService } from '../mailings/mailing-tasks.service';
import { formatLessonWhen, type MailPerson } from '../mailings/mail-vars';
import type { MailingType } from '../mailings/mailing.types';
import { HOUR_FROM, HOUR_TO, ScheduleService } from '../schedule/schedule.service';
import { LessonPresentationsService } from '../curriculum/lesson-presentations.service';
import { ContentChainService } from '../curriculum/content-chain.service';
import { TestsService } from '../tests/tests.service';
import type { ProposeLessonDto } from './dto/propose-lesson.dto';

const LOCKED: LessonStatus[] = ['proposed', 'confirmed', 'rescheduling', 'done', 'missed', 'admin_skip', 'frozen'];
const TAKEN: LessonStatus[] = ['proposed', 'confirmed', 'rescheduling'];
const TERMINAL: LessonStatus[] = ['done', 'missed', 'admin_skip', 'frozen', 'cancelled'];
const SEQUENCED: LessonStatus[] = ['proposed', 'confirmed', 'rescheduling', 'done', 'missed', 'admin_skip', 'frozen'];

function isNegotiating(status: LessonStatus) {
  return status === 'proposed' || status === 'rescheduling';
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function fromSlot(date: string, hour: number, minute = 0) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
}

function toSlot(value: Date | null) {
  if (!value) return { date: null as string | null, hour: null as number | null, minute: null as number | null };
  return {
    date: `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`,
    hour: value.getUTCHours(),
    minute: value.getUTCMinutes(),
  };
}

function mondayOf(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay() === 0 ? 7 : date.getDay();
  date.setDate(date.getDate() - (weekday - 1));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isPast(date: string, hour: number, minute = 0) {
  const now = new Date();
  const today = todayKey();
  if (date < today) return true;
  if (date > today) return false;
  if (hour < now.getHours()) return true;
  if (hour > now.getHours()) return false;
  return minute <= now.getMinutes();
}

function monthBounds(date = new Date()) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { from, to };
}

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedule: ScheduleService,
    private readonly mailer: MailingsMailerService,
    private readonly mailingTasks: MailingTasksService,
    private readonly presentations: LessonPresentationsService,
    private readonly chain: ContentChainService,
    private readonly tests: TestsService,
  ) {}

  async board(userId: number, role: 'student' | 'teacher' | null) {
    if (role === 'teacher') {
      const students = await this.prisma.user.findMany({
        where: { teacherId: userId, userRole: 'student' },
        select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
        orderBy: { name: 'asc' },
      });
      const groups = [];
      for (const student of students) {
        await this.syncForStudent(student.id);
        groups.push({
          student,
          ...(await this.packForStudent(student.id)),
        });
      }
      return { role: 'teacher' as const, groups };
    }

    await this.syncForStudent(userId);
    return {
      role: 'student' as const,
      ...(await this.packForStudent(userId)),
    };
  }

  async teacherGroup(userId: number, role: 'student' | 'teacher' | null, studentId: number) {
    if (role !== 'teacher') {
      throw new ForbiddenException('Ця сторінка лише для вчителя');
    }
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, teacherId: userId, userRole: 'student' },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
    });
    if (!student) {
      throw new NotFoundException('Учня не знайдено');
    }
    await this.syncForStudent(student.id);
    return {
      role: 'teacher' as const,
      student,
      ...(await this.packForStudent(student.id)),
    };
  }

  async show(userId: number, role: 'student' | 'teacher' | null, lessonId: number) {
    const lesson = await this.loadLesson(lessonId);
    this.assertCanView(userId, role, lesson);
    const quota = await this.freezeQuota(lesson.userTariffId);
    const material = await this.presentations.resolveScheduledMaterial(lesson);
    const materialChain = await this.chain.resolveScheduledLessonChain(lesson);
    const linkedTests = materialChain
      ? await this.tests.listMaterialTestsForChain(materialChain, userId, {
          autoGrant: true,
          revealPassword: role === 'teacher',
        })
      : [];
    return {
      lesson: this.toPublic(lesson, lesson.status === 'confirmed' && quota.left > 0),
      student: {
        id: lesson.student.id,
        name: lesson.student.name,
        email: lesson.student.email,
        phone: lesson.student.phone,
        avatarUrl: lesson.student.avatarUrl,
      },
      freeze: quota,
      material,
      linkedTests,
    };
  }

  async slots(userId: number, role: 'student' | 'teacher' | null, lessonId: number, from?: string) {
    const lesson = await this.loadLesson(lessonId);
    this.assertCanView(userId, role, lesson);
    const teacherId = lesson.teacherId ?? lesson.student.teacherId;
    if (!teacherId) {
      throw new BadRequestException('Спочатку потрібен учитель');
    }
    const sequence = await this.sequenceBounds(lesson);
    const weekFrom = mondayOf(from || todayKey());
    const [teacherWeek, studentWeek] = await Promise.all([
      this.schedule.overview(teacherId, weekFrom),
      this.schedule.overview(lesson.studentId, weekFrom),
    ]);
    const blocked = await this.blockedSlots(lesson.studentId, teacherId, lesson.id);
    const days = teacherWeek.days.map((day, index) => {
      const studentDay = studentWeek.days[index];
      const hours = sequence.blockedReason
        ? []
        : day.hours
            .filter((slot) => {
              if (slot.state !== 'free') return false;
              if (studentDay?.hours.find((item) => item.hour === slot.hour)?.state !== 'free') return false;
              if (isPast(day.date, slot.hour)) return false;
              if (!this.fitsSequence(day.date, slot.hour, 0, sequence)) return false;
              return !blocked.has(`${day.date}-${slot.hour}`);
            })
            .map((slot) => slot.hour);
      return { date: day.date, weekday: day.weekday, hours };
    });
    return {
      from: weekFrom,
      hourFrom: HOUR_FROM,
      hourTo: HOUR_TO,
      days,
      sequence: {
        blockedReason: sequence.blockedReason,
        hint: sequence.hint,
        afterDate: sequence.afterDate,
      },
    };
  }

  async propose(userId: number, role: 'student' | 'teacher' | null, lessonId: number, dto: ProposeLessonDto) {
    const actor = this.actorOf(role);
    const lesson = await this.loadLesson(lessonId);
    this.assertCanPropose(userId, actor, lesson);
    const teacherId = lesson.teacherId ?? lesson.student.teacherId;
    if (!teacherId) {
      throw new BadRequestException('Спочатку потрібен учитель');
    }
    const sequence = await this.sequenceBounds(lesson);
    if (sequence.blockedReason) {
      throw new BadRequestException(sequence.blockedReason);
    }
    const minute = dto.minute ?? 0;
    const week = await this.slots(userId, role, lessonId, dto.date);
    const day = week.days.find((item) => item.date === dto.date);
    if (!day?.hours.includes(dto.hour)) {
      throw new BadRequestException(
        this.fitsSequence(dto.date, dto.hour, minute, sequence)
          ? 'Цей час не вільний у вас обох'
          : 'Цей час порушує черговість уроків',
      );
    }
    if (isPast(dto.date, dto.hour, minute)) {
      throw new BadRequestException('Цей час уже минув');
    }
    if (!this.fitsSequence(dto.date, dto.hour, minute, sequence)) {
      throw new BadRequestException('Цей час порушує черговість уроків');
    }
    const startsAt = fromSlot(dto.date, dto.hour, minute);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    const reschedule = lesson.status === 'confirmed' || lesson.status === 'rescheduling';
    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        status: reschedule ? 'rescheduling' : 'proposed',
        proposedBy: actor,
        teacherId,
        startsAt,
        endsAt,
        ...(lesson.status === 'confirmed'
          ? { priorStartsAt: lesson.startsAt, priorEndsAt: lesson.endsAt }
          : {}),
      },
    });
    await this.mailingTasks.cancelLesson(
      lesson.id,
      reschedule
        ? 'Урок на перенесенні. Нагадування скасовано.'
        : 'Урок знову на узгодженні. Нагадування скасовано.',
    );
    if (actor === 'teacher') {
      await this.mailLesson('lesson_teacher_proposed', lesson, 'student', { startsAt });
    } else {
      await this.mailLesson('lesson_student_counter', lesson, 'teacher', { startsAt });
    }
    return this.board(userId, role);
  }

  async accept(userId: number, role: 'student' | 'teacher' | null, lessonId: number) {
    const actor = this.actorOf(role);
    const lesson = await this.loadLesson(lessonId);
    this.assertWaitingOn(userId, actor, lesson);
    if (!lesson.startsAt) {
      throw new BadRequestException('Немає запропонованого часу');
    }
    const sequence = await this.sequenceBounds(lesson);
    if (sequence.blockedReason) {
      throw new BadRequestException(sequence.blockedReason);
    }
    const slot = toSlot(lesson.startsAt);
    if (slot.date && slot.hour != null && !this.fitsSequence(slot.date, slot.hour, slot.minute ?? 0, sequence)) {
      throw new BadRequestException('Цей час порушує черговість уроків');
    }
    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        status: 'confirmed',
        proposedBy: lesson.proposedBy,
        priorStartsAt: null,
        priorEndsAt: null,
      },
    });
    await this.mailingTasks.syncLesson(lesson.id);
    if (actor === 'student') {
      await this.mailLesson('lesson_student_confirmed', lesson, 'teacher');
    } else {
      await this.mailLesson('lesson_teacher_confirmed', lesson, 'student');
    }
    return this.board(userId, role);
  }

  async decline(userId: number, role: 'student' | 'teacher' | null, lessonId: number) {
    const actor = this.actorOf(role);
    const lesson = await this.loadLesson(lessonId);
    this.assertWaitingOn(userId, actor, lesson);
    const declinedAt = lesson.startsAt;
    const notifyRole = actor === 'student' ? 'teacher' : 'student';
    const actorName = actor === 'student' ? lesson.student.name : (lesson.teacher?.name || 'Викладач');

    if (lesson.status === 'rescheduling') {
      if (!lesson.priorStartsAt || !lesson.priorEndsAt) {
        throw new BadRequestException('Немає попереднього підтвердженого часу');
      }
      await this.prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          status: 'confirmed',
          proposedBy: null,
          startsAt: lesson.priorStartsAt,
          endsAt: lesson.priorEndsAt,
          priorStartsAt: null,
          priorEndsAt: null,
        },
      });
      await this.mailingTasks.syncLesson(lesson.id);
      await this.mailLesson('lesson_declined', lesson, notifyRole, {
        startsAt: declinedAt,
        actorName,
      });
      return this.board(userId, role);
    }

    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        status: 'unscheduled',
        proposedBy: null,
        startsAt: null,
        endsAt: null,
        priorStartsAt: null,
        priorEndsAt: null,
      },
    });
    await this.mailingTasks.cancelLesson(lesson.id, 'Час уроку скасовано. Нагадування скасовано.');
    await this.mailLesson('lesson_declined', lesson, notifyRole, {
      startsAt: declinedAt,
      actorName,
    });
    return this.board(userId, role);
  }

  async freeze(userId: number, role: 'student' | 'teacher' | null, lessonId: number) {
    if (role !== 'student') {
      throw new ForbiddenException('Заморозити урок може лише учень');
    }
    const lesson = await this.loadLesson(lessonId);
    this.assertCanView(userId, role, lesson);
    if (lesson.status !== 'confirmed') {
      throw new BadRequestException('Заморозити можна лише узгоджений урок');
    }
    const quota = await this.freezeQuota(lesson.userTariffId);
    if (quota.perMonth <= 0) {
      throw new BadRequestException('У цьому тарифі немає заморозок');
    }
    if (quota.left <= 0) {
      throw new BadRequestException(`Цього місяця вже використано ${quota.used} з ${quota.perMonth} заморозок`);
    }
    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        status: 'frozen',
        frozenAt: new Date(),
        proposedBy: lesson.proposedBy,
      },
    });
    await this.mailingTasks.cancelLesson(lesson.id, 'Урок заморожено. Нагадування скасовано.');
    await this.mailLesson('lesson_frozen_student', lesson, 'student');
    await this.mailLesson('lesson_frozen_teacher', lesson, 'teacher');
    return this.board(userId, role);
  }

  async complete(userId: number, role: 'student' | 'teacher' | null, lessonId: number) {
    this.assertTeacher(role);
    const lesson = await this.loadLesson(lessonId);
    this.assertCanCloseByTeacher(userId, lesson);
    await this.closeLesson(lesson, 'done', 'Урок уже відбувся. Нагадування скасовано.');
    return this.board(userId, role);
  }

  async assignContent(
    userId: number,
    role: 'student' | 'teacher' | null,
    lessonId: number,
    dto: { contentLessonId?: number | null; teacherLessonId?: number | null },
  ) {
    if (role !== 'teacher') {
      throw new ForbiddenException('Призначати матеріал може лише вчитель');
    }
    const lesson = await this.loadLesson(lessonId);
    this.assertCanView(userId, role, lesson);
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        contentLessonId: dto.contentLessonId !== undefined ? (dto.contentLessonId ?? null) : undefined,
        teacherLessonId: dto.teacherLessonId !== undefined ? (dto.teacherLessonId ?? null) : undefined,
      },
    });
  }

  async miss(userId: number, role: 'student' | 'teacher' | null, lessonId: number) {
    this.assertTeacher(role);
    const lesson = await this.loadLesson(lessonId);
    this.assertCanCloseByTeacher(userId, lesson);
    await this.closeLesson(lesson, 'missed', 'Учень пропустив урок. Нагадування скасовано.');
    return this.board(userId, role);
  }

  async completeByAdmin(studentId: number, lessonId: number) {
    const lesson = await this.loadLessonForStudent(studentId, lessonId);
    this.assertConfirmed(lesson);
    this.assertStarted(lesson);
    await this.closeLesson(lesson, 'done', 'Урок уже відбувся. Нагадування скасовано.');
    return this.listForStudent(studentId);
  }

  async skipByAdmin(studentId: number, lessonId: number) {
    const lesson = await this.loadLessonForStudent(studentId, lessonId);
    this.assertConfirmed(lesson);
    await this.closeLesson(lesson, 'admin_skip', 'Адміністратор позначив пропуск. Нагадування скасовано.');
    return this.listForStudent(studentId);
  }

  async listForStudent(studentId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    const current = await this.prisma.userTariff.findFirst({
      where: { userId: studentId, status: 'active' },
      select: { id: true },
    });
    const freeze = current ? await this.freezeQuota(current.id) : null;
    const lessons = await this.prisma.lesson.findMany({
      where: { studentId, status: { not: 'cancelled' } },
      include: {
        userTariff: { include: { tariff: { select: { title: true, lessonPrice: true } } } },
        teacher: { select: { id: true, name: true } },
        student: { select: { id: true, name: true } },
      },
      orderBy: [{ number: 'asc' }, { id: 'asc' }],
    });
    return {
      freeze,
      lessons: lessons.map((row) => this.toPublic(row)),
    };
  }

  async refundByAdmin(studentId: number, lessonId: number) {
    const lesson = await this.loadLesson(lessonId);
    if (lesson.studentId !== studentId) {
      throw new ForbiddenException('Це не урок цього учня');
    }
    if (lesson.status !== 'frozen') {
      throw new BadRequestException('Повернути кошти можна лише за заморожений урок');
    }
    if (lesson.refundedAt) {
      throw new BadRequestException('Кошти за цей урок уже позначено як повернуті');
    }
    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: { refundedAt: new Date() },
    });
    return this.listForStudent(studentId);
  }

  async syncForTariff(userTariffId: number) {
    const sub = await this.prisma.userTariff.findUnique({
      where: { id: userTariffId },
      include: {
        user: { select: { id: true, teacherId: true } },
        payments: { orderBy: { partNumber: 'asc' } },
        lessons: { orderBy: { number: 'asc' } },
      },
    });
    if (!sub) return;

    const unpaidIds = sub.payments.filter((row) => !row.paidAt).map((row) => row.id);
    if (unpaidIds.length) {
      const locked = await this.prisma.lesson.count({
        where: { paymentId: { in: unpaidIds }, status: { in: LOCKED } },
      });
      if (locked) {
        throw new BadRequestException('Не можна зняти оплату: є вже узгоджені заняття');
      }
      await this.prisma.lesson.deleteMany({
        where: { userTariffId, paymentId: { in: unpaidIds }, status: 'unscheduled' },
      });
    }

    const existing = await this.prisma.lesson.findMany({
      where: { userTariffId },
      orderBy: { number: 'asc' },
    });
    let nextNumber = existing.reduce((max, row) => Math.max(max, row.number), 0);

    for (const payment of sub.payments.filter((row) => row.paidAt)) {
      const rows = existing.filter((row) => row.paymentId === payment.id);
      const missing = payment.lessons - rows.length;
      if (missing > 0) {
        const data = Array.from({ length: missing }, () => {
          nextNumber += 1;
          return {
            studentId: sub.userId,
            teacherId: sub.user.teacherId,
            userTariffId,
            paymentId: payment.id,
            number: nextNumber,
            status: 'unscheduled' as const,
          };
        });
        await this.prisma.lesson.createMany({ data });
      } else if (missing < 0) {
        const extras = rows.filter((row) => row.status === 'unscheduled').slice(missing);
        if (extras.length) {
          await this.prisma.lesson.deleteMany({ where: { id: { in: extras.map((row) => row.id) } } });
        }
      }
    }

    await this.prisma.lesson.updateMany({
      where: { userTariffId, status: 'unscheduled' },
      data: { teacherId: sub.user.teacherId },
    });
  }

  async syncForStudent(userId: number) {
    const rows = await this.prisma.userTariff.findMany({
      where: { userId, status: { in: ['active', 'expired'] } },
      select: { id: true },
    });
    for (const row of rows) {
      await this.syncForTariff(row.id);
    }
  }

  private async packForStudent(studentId: number) {
    const current = await this.prisma.userTariff.findFirst({
      where: { userId: studentId, status: 'active' },
      include: { tariff: true, payments: { orderBy: { partNumber: 'asc' } } },
    });
    const freeze = current
      ? await this.freezeQuota(current.id)
      : { perMonth: 0, used: 0, left: 0 };
    const lessons = await this.prisma.lesson.findMany({
      where: { studentId, status: { not: 'cancelled' } },
      include: {
        userTariff: { include: { tariff: { select: { title: true, lessonPrice: true } } } },
        teacher: { select: { id: true, name: true } },
        student: { select: { id: true, name: true } },
      },
      orderBy: [{ number: 'asc' }, { id: 'asc' }],
    });
    const quotaBySub = new Map<number, { left: number }>();
    for (const id of new Set(lessons.map((row) => row.userTariffId))) {
      quotaBySub.set(id, await this.freezeQuota(id));
    }
    const publicLessons = lessons.map((row) =>
      this.toPublic(row, row.status === 'confirmed' && (quotaBySub.get(row.userTariffId)?.left ?? 0) > 0),
    );
    const availableLessons = current
      ? current.payments.filter((row) => row.paidAt).reduce((sum, row) => sum + row.lessons, 0)
      : publicLessons.length;
    return {
      current: current
        ? {
            id: current.id,
            title: current.tariff.title,
            startsAt: current.startsAt.toISOString(),
            endsAt: current.endsAt.toISOString(),
            availableLessons,
            totalLessons: current.tariff.lessons,
          }
        : null,
      freeze,
      unscheduled: publicLessons.filter((row) => row.status === 'unscheduled'),
      upcoming: publicLessons.filter(
        (row) => row.status === 'proposed' || row.status === 'rescheduling' || row.status === 'confirmed',
      ),
      frozen: publicLessons.filter((row) => row.status === 'frozen'),
      done: publicLessons.filter((row) => row.status === 'done'),
      missed: publicLessons.filter((row) => row.status === 'missed'),
      adminSkip: publicLessons.filter((row) => row.status === 'admin_skip'),
    };
  }

  private async mailLesson(
    type: MailingType,
    lesson: {
      number: number;
      startsAt: Date | null;
      teacherId: number | null;
      student: MailPerson & { teacherId: number | null };
      teacher: MailPerson | null;
    },
    to: 'student' | 'teacher',
    extra?: { startsAt?: Date | null; actorName?: string },
  ) {
    const teacher = await this.resolveTeacher(lesson);
    const recipient = to === 'student' ? lesson.student : teacher;
    if (!recipient) return;
    const startsAt = formatLessonWhen(extra?.startsAt ?? lesson.startsAt);
    await this.mailer.sendToUser(type, recipient, {
      lesson_number: String(lesson.number),
      teacher_name: teacher?.name || 'викладач',
      student_name: lesson.student.name,
      counterpart_name: to === 'student' ? teacher?.name || 'викладач' : lesson.student.name,
      actor_name: extra?.actorName || '',
      starts_at: startsAt,
      cabinet_url: this.mailer.cabinetUrl(to),
    });
  }

  private async resolveTeacher(lesson: {
    teacherId: number | null;
    student: { teacherId: number | null };
    teacher: MailPerson | null;
  }) {
    if (lesson.teacher?.email) return lesson.teacher;
    const teacherId = lesson.teacherId ?? lesson.student.teacherId;
    if (!teacherId) return null;
    return this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, email: true, name: true, firstName: true, lastName: true, middleName: true },
    });
  }

  private async loadLesson(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            firstName: true,
            lastName: true,
            middleName: true,
            teacherId: true,
          },
        },
        teacher: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true, middleName: true },
        },
        userTariff: { include: { tariff: { select: { title: true, lessonPrice: true } } } },
      },
    });
    if (!lesson) {
      throw new NotFoundException('Заняття не знайдено');
    }
    return lesson;
  }

  private assertTeacher(role: 'student' | 'teacher' | null) {
    if (role !== 'teacher') {
      throw new ForbiddenException('Позначити результат уроку може лише вчитель');
    }
  }

  private assertCanCloseByTeacher(
    userId: number,
    lesson: Lesson & { student: { teacherId: number | null } },
  ) {
    this.assertCanView(userId, 'teacher', lesson);
    this.assertConfirmed(lesson);
    this.assertStarted(lesson);
  }

  private assertConfirmed(lesson: { status: LessonStatus }) {
    if (lesson.status !== 'confirmed') {
      throw new BadRequestException('Результат можна поставити лише на підтверджений урок');
    }
  }

  private assertStarted(lesson: { startsAt: Date | null }) {
    if (!lesson.startsAt) {
      throw new BadRequestException('У уроку немає дати');
    }
    if (lesson.startsAt.getTime() > Date.now()) {
      throw new BadRequestException('Позначити можна після початку уроку');
    }
  }

  private async loadLessonForStudent(studentId: number, lessonId: number) {
    const lesson = await this.loadLesson(lessonId);
    if (lesson.studentId !== studentId) {
      throw new ForbiddenException('Це не урок цього учня');
    }
    return lesson;
  }

  private async closeLesson(
    lesson: { id: number; proposedBy: LessonActor | null },
    status: Extract<LessonStatus, 'done' | 'missed' | 'admin_skip'>,
    cancelNote: string,
  ) {
    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: { status, proposedBy: lesson.proposedBy },
    });
    await this.mailingTasks.cancelLesson(lesson.id, cancelNote);
  }

  private actorOf(role: 'student' | 'teacher' | null): LessonActor {
    if (role !== 'student' && role !== 'teacher') {
      throw new ForbiddenException('Немає доступу');
    }
    return role;
  }

  private assertCanView(
    userId: number,
    role: 'student' | 'teacher' | null,
    lesson: { studentId: number; teacherId: number | null; student: { teacherId: number | null } },
  ) {
    if (role === 'student' && lesson.studentId === userId) return;
    const teacherId = lesson.teacherId ?? lesson.student.teacherId;
    if (role === 'teacher' && teacherId === userId) return;
    throw new ForbiddenException('Це не ваше заняття');
  }

  private assertCanPropose(
    userId: number,
    actor: LessonActor,
    lesson: Lesson & { student: { teacherId: number | null } },
  ) {
    this.assertCanView(userId, actor, lesson);
    if (TERMINAL.includes(lesson.status)) {
      throw new BadRequestException('Це заняття вже не можна перенести так');
    }
    if (actor === 'teacher') {
      if (lesson.status === 'unscheduled') return;
      if (lesson.status === 'confirmed') return;
      if (lesson.status === 'proposed' && lesson.proposedBy === 'student') return;
      if (lesson.status === 'rescheduling' && lesson.proposedBy === 'student') return;
      throw new BadRequestException('Зачекайте відповіді учня');
    }
    if (lesson.status === 'confirmed') {
      if (lesson.startsAt && lesson.startsAt.getTime() <= Date.now()) {
        throw new BadRequestException('Після початку уроку перенести може лише вчитель');
      }
      return;
    }
    if (lesson.status === 'proposed' && lesson.proposedBy === 'teacher') return;
    if (lesson.status === 'rescheduling' && lesson.proposedBy === 'teacher') return;
    throw new BadRequestException('Спочатку вчитель має запропонувати час');
  }

  private assertWaitingOn(
    userId: number,
    actor: LessonActor,
    lesson: Lesson & { student: { teacherId: number | null } },
  ) {
    this.assertCanView(userId, actor, lesson);
    if (!isNegotiating(lesson.status)) {
      throw new BadRequestException('Немає активної пропозиції');
    }
    const waitingOn = lesson.proposedBy === 'teacher' ? 'student' : 'teacher';
    if (waitingOn !== actor) {
      throw new BadRequestException('Зачекайте відповіді іншої сторони');
    }
  }

  private async sequenceBounds(lesson: { id: number; number: number; userTariffId: number }) {
    const predecessor = await this.prisma.lesson.findFirst({
      where: {
        userTariffId: lesson.userTariffId,
        number: { lt: lesson.number },
        status: { not: 'cancelled' },
      },
      orderBy: { number: 'desc' },
      select: { number: true, startsAt: true, status: true },
    });
    if (predecessor && !predecessor.startsAt) {
      return {
        after: null as Date | null,
        before: null as Date | null,
        afterDate: null as string | null,
        blockedReason: `Спочатку поставте час для уроку №${predecessor.number}. Уроки йдуть за номерами.`,
        hint: null as string | null,
      };
    }

    const siblings = await this.prisma.lesson.findMany({
      where: {
        userTariffId: lesson.userTariffId,
        id: { not: lesson.id },
        startsAt: { not: null },
        status: { in: SEQUENCED },
      },
      select: { number: true, startsAt: true },
    });
    const prev = siblings
      .filter((row) => row.number < lesson.number && row.startsAt)
      .sort((a, b) => b.number - a.number)[0];
    const next = siblings
      .filter((row) => row.number > lesson.number && row.startsAt)
      .sort((a, b) => a.number - b.number)[0];
    const after = prev?.startsAt ?? null;
    const before = next?.startsAt ?? null;
    const parts: string[] = [];
    if (after && prev) parts.push(`після уроку №${prev.number} (${formatLessonWhen(after)})`);
    if (before && next) parts.push(`до уроку №${next.number} (${formatLessonWhen(before)})`);
    return {
      after,
      before,
      afterDate: after ? toSlot(after).date : null,
      blockedReason: null as string | null,
      hint: parts.length ? `Уроки йдуть за номерами. Цей слот має бути ${parts.join(' і ')}.` : null,
    };
  }

  private fitsSequence(
    date: string,
    hour: number,
    minute: number,
    sequence: { after: Date | null; before: Date | null; blockedReason: string | null },
  ) {
    if (sequence.blockedReason) return false;
    const time = fromSlot(date, hour, minute).getTime();
    if (sequence.after && time <= sequence.after.getTime()) return false;
    if (sequence.before && time >= sequence.before.getTime()) return false;
    return true;
  }

  private async blockedSlots(studentId: number, teacherId: number, exceptId: number) {
    const rows = await this.prisma.lesson.findMany({
      where: {
        id: { not: exceptId },
        status: { in: TAKEN },
        startsAt: { not: null },
        OR: [{ studentId: { in: [studentId, teacherId] } }, { teacherId: { in: [studentId, teacherId] } }],
      },
      select: { startsAt: true },
    });
    const set = new Set<string>();
    for (const row of rows) {
      const slot = toSlot(row.startsAt);
      if (slot.date != null && slot.hour != null) {
        set.add(`${slot.date}-${slot.hour}`);
      }
    }
    return set;
  }

  private async freezeQuota(userTariffId: number) {
    const sub = await this.prisma.userTariff.findUnique({
      where: { id: userTariffId },
      include: { tariff: { select: { frozenLessonsPerMonth: true } } },
    });
    const perMonth = sub?.tariff.frozenLessonsPerMonth ?? 0;
    const { from, to } = monthBounds();
    const used = await this.prisma.lesson.count({
      where: {
        userTariffId,
        status: 'frozen',
        frozenAt: { gte: from, lt: to },
      },
    });
    return { perMonth, used, left: Math.max(0, perMonth - used) };
  }

  private toPublic(
    row: Lesson & {
      userTariff: { tariff: { title: string; lessonPrice?: number } };
      teacher: { id: number; name: string } | null;
      student?: { id: number; name: string };
    },
    canFreeze = false,
  ) {
    const slot = toSlot(row.startsAt);
    const waitingOn = isNegotiating(row.status)
      ? row.proposedBy === 'teacher'
        ? 'student'
        : 'teacher'
      : null;
    return {
      id: row.id,
      number: row.number,
      status: row.status,
      proposedBy: row.proposedBy,
      waitingOn,
      startDate: slot.date,
      startHour: slot.hour,
      startMinute: slot.minute,
      tariffTitle: row.userTariff.tariff.title,
      frozenAt: row.frozenAt ? row.frozenAt.toISOString() : null,
      refundedAt: row.refundedAt ? row.refundedAt.toISOString() : null,
      refundAmount: row.userTariff.tariff.lessonPrice ?? 0,
      canFreeze,
      canStudentReschedule:
        row.status === 'confirmed' && !!row.startsAt && row.startsAt.getTime() > Date.now(),
      teacher: row.teacher,
      student: row.student ?? null,
    };
  }
}
