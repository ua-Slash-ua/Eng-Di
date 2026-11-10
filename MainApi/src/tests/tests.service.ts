import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ContentEntityType,
  TestAccessDuration,
  TestAnswerKind,
  TestAttemptStatus,
  TestKind,
} from '@prisma/client';
import type { ContentChainLink } from '../curriculum/content-chain.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTestDto,
  DEFAULT_MAX_ATTEMPTS,
  MAX_EXTRA_ATTEMPTS,
  SubmitAttemptDto,
  UpdateTestDto,
  UpsertTestQuestionDto,
} from './dto/test.dto';

const MAX_QUESTIONS = 100;
const MAX_OPTIONS = 10;

type OrderSnapshot = {
  questionIds: number[];
  optionIdsByQuestion: Record<string, number[]>;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function durationMs(duration: TestAccessDuration): number | null {
  switch (duration) {
    case TestAccessDuration.m1:
      return 60_000;
    case TestAccessDuration.m5:
      return 5 * 60_000;
    case TestAccessDuration.m15:
      return 15 * 60_000;
    case TestAccessDuration.h1:
      return 60 * 60_000;
    case TestAccessDuration.forever:
      return null;
    default:
      return null;
  }
}

function isGrantActive(expiresAt: Date | null | undefined) {
  if (expiresAt == null) return true;
  return expiresAt.getTime() > Date.now();
}

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  private questionInclude = {
    options: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  };

  private fullInclude = {
    questions: {
      orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
      include: this.questionInclude,
    },
  };

  listTests(kind?: TestKind) {
    return this.prisma.test.findMany({
      where: kind ? { kind } : {},
      orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });
  }

  async findTest(id: number) {
    const item = await this.prisma.test.findUnique({
      where: { id },
      include: this.fullInclude,
    });
    if (!item) throw new NotFoundException('Тест не знайдено');
    return item;
  }

  private validateQuestions(questions: UpsertTestQuestionDto[] | undefined) {
    if (!questions) return;
    if (questions.length > MAX_QUESTIONS) {
      throw new BadRequestException(`Максимум ${MAX_QUESTIONS} питань`);
    }
    for (let qi = 0; qi < questions.length; qi += 1) {
      const q = questions[qi];
      const label = `Питання ${qi + 1}`;
      if (!q.prompt?.trim()) {
        throw new BadRequestException(`${label}: вкажіть текст питання`);
      }
      if (!q.options?.length) {
        throw new BadRequestException(`${label}: має мати хоча б одну відповідь`);
      }
      if (q.options.length > MAX_OPTIONS) {
        throw new BadRequestException(`${label}: максимум ${MAX_OPTIONS} відповідей`);
      }
      for (const o of q.options) {
        if (!o.text?.trim()) {
          throw new BadRequestException(`${label}: текст відповіді не може бути порожнім`);
        }
      }
      const writeIns = q.options.filter((o) => o.kind === TestAnswerKind.write_in);
      if (writeIns.length > 1) {
        throw new BadRequestException(`${label}: не більше однієї write-in відповіді`);
      }
      const hasWriteInKey = writeIns.some((o) => o.text.trim().length > 0);
      const hasChoiceCorrect = q.options.some(
        (o) => o.kind === TestAnswerKind.choice && Boolean(o.isCorrect),
      );
      if (!hasWriteInKey && !hasChoiceCorrect) {
        throw new BadRequestException(
          `${label}: потрібна хоча б одна правильна відповідь (відмітьте варіант або додайте write-in з ключем)`,
        );
      }
    }
  }

  private normalizeEntity(kind: TestKind, entityType?: ContentEntityType | null, entityId?: number | null) {
    if (kind === TestKind.free) {
      return { entityType: null, entityId: null };
    }
    if (!entityType || !entityId) {
      throw new BadRequestException('Для тесту матеріалу потрібні entityType та entityId');
    }
    return { entityType, entityId };
  }

  private async replaceQuestions(testId: number, questions: UpsertTestQuestionDto[]) {
    this.validateQuestions(questions);

    const existing = await this.prisma.testQuestion.findMany({
      where: { testId },
      include: { options: true },
    });
    const existingById = new Map(existing.map((q) => [q.id, q]));
    const keepQuestionIds = new Set(
      questions.map((q) => q.id).filter((id): id is number => typeof id === 'number' && id > 0),
    );

    const removeIds = existing.filter((q) => !keepQuestionIds.has(q.id)).map((q) => q.id);
    if (removeIds.length) {
      await this.prisma.testQuestion.deleteMany({ where: { id: { in: removeIds } } });
    }

    for (let qi = 0; qi < questions.length; qi += 1) {
      const q = questions[qi];
      const prompt = q.prompt.trim();
      const sortOrder = q.sortOrder ?? qi + 1;
      const current = q.id ? existingById.get(q.id) : undefined;

      if (current) {
        await this.prisma.testQuestion.update({
          where: { id: current.id },
          data: { prompt, sortOrder },
        });
        await this.replaceOptions(current.id, q.options, current.options);
      } else {
        await this.prisma.testQuestion.create({
          data: {
            testId,
            prompt,
            sortOrder,
            options: {
              create: q.options.map((o, oi) => ({
                text: o.text.trim(),
                kind: o.kind,
                isCorrect: o.kind === TestAnswerKind.write_in ? true : Boolean(o.isCorrect),
                sortOrder: o.sortOrder ?? oi + 1,
              })),
            },
          },
        });
      }
    }

    await this.regradeSubmittedAttempts(testId);
  }

  private async replaceOptions(
    questionId: number,
    options: UpsertTestQuestionDto['options'],
    existing: Array<{ id: number }>,
  ) {
    const existingIds = new Set(existing.map((o) => o.id));
    const keepIds = new Set(
      options.map((o) => o.id).filter((id): id is number => typeof id === 'number' && id > 0),
    );
    const removeIds = [...existingIds].filter((id) => !keepIds.has(id));
    if (removeIds.length) {
      await this.prisma.testAnswerOption.deleteMany({ where: { id: { in: removeIds } } });
    }

    for (let oi = 0; oi < options.length; oi += 1) {
      const o = options[oi];
      const data = {
        text: o.text.trim(),
        kind: o.kind,
        isCorrect: o.kind === TestAnswerKind.write_in ? true : Boolean(o.isCorrect),
        sortOrder: o.sortOrder ?? oi + 1,
      };
      if (o.id && existingIds.has(o.id)) {
        await this.prisma.testAnswerOption.update({ where: { id: o.id }, data });
      } else {
        await this.prisma.testAnswerOption.create({
          data: { questionId, ...data },
        });
      }
    }
  }

  /** Re-score all submitted attempts after answer keys change. */
  private async regradeSubmittedAttempts(testId: number) {
    const test = await this.findTest(testId);
    const attempts = await this.prisma.testAttempt.findMany({
      where: { testId, status: TestAttemptStatus.submitted },
      include: { answers: true },
    });
    if (!attempts.length) return;

    const questionIds = new Set(test.questions.map((q) => q.id));

    for (const attempt of attempts) {
      const answersByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));

      for (const answer of attempt.answers) {
        if (!questionIds.has(answer.questionId)) {
          await this.prisma.testAttemptAnswer.delete({ where: { id: answer.id } });
        }
      }

      let correctCount = 0;
      for (const q of test.questions) {
        const ans = answersByQuestion.get(q.id);
        const selected = Array.isArray(ans?.selectedOptionIds)
          ? (ans!.selectedOptionIds as number[])
          : [];
        const written = ans?.writtenText ?? null;
        const ok = this.gradeQuestion(q.options, selected, written);
        if (ok) correctCount += 1;

        if (ans) {
          await this.prisma.testAttemptAnswer.update({
            where: { id: ans.id },
            data: { isCorrect: ok },
          });
        } else {
          await this.prisma.testAttemptAnswer.create({
            data: {
              attemptId: attempt.id,
              questionId: q.id,
              selectedOptionIds: [],
              writtenText: null,
              isCorrect: ok,
            },
          });
        }
      }

      const score = test.questions.length
        ? Math.round((correctCount / test.questions.length) * 100)
        : 0;
      await this.prisma.testAttempt.update({
        where: { id: attempt.id },
        data: { score },
      });
    }
  }

  async createTest(dto: CreateTestDto) {
    this.validateQuestions(dto.questions);
    const entity = this.normalizeEntity(dto.kind, dto.entityType, dto.entityId);
    const last = await this.prisma.test.findFirst({ orderBy: { sortOrder: 'desc' } });
    const created = await this.prisma.test.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        kind: dto.kind,
        entityType: entity.entityType,
        entityId: entity.entityId,
        accessDuration: dto.accessDuration,
        entryPassword: dto.entryPassword.trim(),
        randomize: dto.randomize ?? false,
        maxAttempts: dto.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        sortOrder: dto.sortOrder ?? (last?.sortOrder ?? 0) + 1,
      },
    });
    if (dto.questions?.length) {
      await this.replaceQuestions(created.id, dto.questions);
    }
    return this.findTest(created.id);
  }

  async updateTest(id: number, dto: UpdateTestDto) {
    const current = await this.findTest(id);
    const kind = dto.kind ?? current.kind;
    const entity = this.normalizeEntity(
      kind,
      dto.entityType !== undefined ? dto.entityType : current.entityType,
      dto.entityId !== undefined ? dto.entityId : current.entityId,
    );
    await this.prisma.test.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
        entityType: entity.entityType,
        entityId: entity.entityId,
        ...(dto.accessDuration !== undefined ? { accessDuration: dto.accessDuration } : {}),
        ...(dto.entryPassword !== undefined ? { entryPassword: dto.entryPassword.trim() } : {}),
        ...(dto.randomize !== undefined ? { randomize: dto.randomize } : {}),
        ...(dto.maxAttempts !== undefined ? { maxAttempts: dto.maxAttempts } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    if (dto.questions !== undefined) {
      await this.replaceQuestions(id, dto.questions);
    }
    return this.findTest(id);
  }

  async removeTest(id: number) {
    await this.findTest(id);
    await this.prisma.test.delete({ where: { id } });
    return { ok: true };
  }

  async getStats(testId: number) {
    await this.findTest(testId);
    const attempts = await this.prisma.testAttempt.findMany({
      where: { testId, status: TestAttemptStatus.submitted },
      select: { score: true, userId: true },
    });
    const totalAttempts = await this.prisma.testAttempt.count({ where: { testId } });
    const submitted = attempts.length;
    const uniqueUsers = new Set(attempts.map((a) => a.userId)).size;
    const scores = attempts.map((a) => a.score ?? 0);
    const avgScore = scores.length
      ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
      : null;
    return {
      totalAttempts,
      submittedAttempts: submitted,
      uniqueUsers,
      avgScore,
      completionRate: totalAttempts ? Math.round((submitted / totalAttempts) * 100) : 0,
    };
  }

  listAttempts(testId: number) {
    return this.prisma.testAttempt.findMany({
      where: { testId },
      orderBy: { startedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, userRole: true } },
      },
    });
  }

  async getAttemptAdmin(testId: number, attemptId: number) {
    const attempt = await this.prisma.testAttempt.findFirst({
      where: { id: attemptId, testId },
      include: {
        user: { select: { id: true, name: true, email: true, userRole: true } },
        answers: true,
        test: { include: this.fullInclude },
      },
    });
    if (!attempt) throw new NotFoundException('Спробу не знайдено');
    return this.buildReviewPayload(attempt);
  }

  // ── Cabinet ──────────────────────────────────────────────────────────────

  async getPublicMeta(testId: number, userId: number) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        title: true,
        description: true,
        kind: true,
        entityType: true,
        entityId: true,
        accessDuration: true,
        randomize: true,
        maxAttempts: true,
        _count: { select: { questions: true } },
      },
    });
    if (!test) throw new NotFoundException('Тест не знайдено');
    const grant = await this.prisma.testAccessGrant.findUnique({
      where: { userId_testId: { userId, testId } },
    });
    const unlocked = Boolean(grant && isGrantActive(grant.expiresAt));
    const quota = await this.getAttemptBudget(testId, userId, test.maxAttempts);
    return {
      ...test,
      unlocked,
      expiresAt: unlocked ? (grant?.expiresAt ?? null) : null,
      attemptsUsed: quota.used,
      extraAttempts: quota.extraAttempts,
      attemptsLimit: quota.limit,
      attemptsRemaining: quota.remaining,
      canStart: quota.canStart,
      hasInProgress: quota.hasInProgress,
    };
  }

  async unlock(testId: number, userId: number, password: string) {
    const test = await this.findTest(testId);
    if (password.trim() !== test.entryPassword) {
      throw new UnauthorizedException('Невірний пароль');
    }
    const ms = durationMs(test.accessDuration);
    const expiresAt = ms == null ? null : new Date(Date.now() + ms);
    const grant = await this.prisma.testAccessGrant.upsert({
      where: { userId_testId: { userId, testId } },
      create: { userId, testId, expiresAt },
      update: { grantedAt: new Date(), expiresAt },
    });
    return { ok: true, expiresAt: grant.expiresAt };
  }

  private async requireActiveGrant(testId: number, userId: number) {
    const grant = await this.prisma.testAccessGrant.findUnique({
      where: { userId_testId: { userId, testId } },
    });
    if (!grant || !isGrantActive(grant.expiresAt)) {
      throw new ForbiddenException('Потрібно ввести пароль для доступу до тесту');
    }
    return grant;
  }

  async startAttempt(testId: number, userId: number) {
    await this.requireActiveGrant(testId, userId);
    const test = await this.findTest(testId);
    if (!test.questions.length) {
      throw new BadRequestException('Тест ще не має питань');
    }

    const existing = await this.prisma.testAttempt.findFirst({
      where: { testId, userId, status: TestAttemptStatus.in_progress },
      orderBy: { startedAt: 'desc' },
    });
    if (existing) {
      return this.buildInProgressPayload(test, existing);
    }

    const budget = await this.getAttemptBudget(testId, userId, test.maxAttempts);
    if (!budget.canStart) {
      throw new ForbiddenException(
        `Вичерпано ліміт спроб (${budget.used} з ${budget.limit}). Зверніться до вчителя або адміністратора.`,
      );
    }

    let questionIds = test.questions.map((q) => q.id);
    const optionIdsByQuestion: Record<string, number[]> = {};
    for (const q of test.questions) {
      const choices = q.options.filter((o) => o.kind === TestAnswerKind.choice).map((o) => o.id);
      const writeIns = q.options.filter((o) => o.kind === TestAnswerKind.write_in).map((o) => o.id);
      const orderedChoices = test.randomize ? shuffle(choices) : choices;
      optionIdsByQuestion[String(q.id)] = [...orderedChoices, ...writeIns];
    }
    if (test.randomize) {
      questionIds = shuffle(questionIds);
    }

    const snapshot: OrderSnapshot = { questionIds, optionIdsByQuestion };
    const attempt = await this.prisma.testAttempt.create({
      data: {
        userId,
        testId,
        status: TestAttemptStatus.in_progress,
        orderSnapshot: snapshot,
      },
    });

    return this.buildInProgressPayload(test, attempt);
  }

  private async buildInProgressPayload(
    test: {
      questions: Array<{
        id: number;
        prompt: string;
        options: Array<{ id: number; text: string; kind: TestAnswerKind }>;
      }>;
    },
    attempt: { id: number; startedAt: Date; orderSnapshot: unknown },
  ) {
    const snapshot = (attempt.orderSnapshot ?? null) as OrderSnapshot | null;
    const questionIds = snapshot?.questionIds?.length
      ? snapshot.questionIds
      : test.questions.map((q) => q.id);
    const optionIdsByQuestion = snapshot?.optionIdsByQuestion ?? {};
    const byId = new Map(test.questions.map((q) => [q.id, q]));
    const questions = questionIds.map((qid) => {
      const q = byId.get(qid)!;
      const optOrder = optionIdsByQuestion[String(qid)] ?? q.options.map((o) => o.id);
      const optById = new Map(q.options.map((o) => [o.id, o]));
      return {
        id: q.id,
        prompt: q.prompt,
        options: optOrder
          .map((oid) => optById.get(oid))
          .filter(Boolean)
          .map((o) => ({
            id: o!.id,
            text: o!.kind === TestAnswerKind.write_in ? '' : o!.text,
            kind: o!.kind,
          })),
      };
    });

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      questions,
    };
  }

  private async getAttemptBudget(testId: number, userId: number, maxAttempts: number) {
    const [used, quota, inProgress] = await Promise.all([
      this.prisma.testAttempt.count({
        where: { testId, userId, status: TestAttemptStatus.submitted },
      }),
      this.prisma.testAttemptQuota.findUnique({
        where: { userId_testId: { userId, testId } },
      }),
      this.prisma.testAttempt.findFirst({
        where: { testId, userId, status: TestAttemptStatus.in_progress },
        select: { id: true },
      }),
    ]);
    const extraAttempts = Math.min(MAX_EXTRA_ATTEMPTS, Math.max(0, quota?.extraAttempts ?? 0));
    const limit = maxAttempts + extraAttempts;
    const hasInProgress = Boolean(inProgress);
    const remaining = Math.max(0, limit - used);
    return {
      used,
      extraAttempts,
      limit,
      remaining,
      hasInProgress,
      canStart: hasInProgress || remaining > 0,
    };
  }

  async listAttemptQuotas(testId: number, options?: { teacherId?: number }) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, maxAttempts: true },
    });
    if (!test) throw new NotFoundException('Тест не знайдено');

    const userScope = options?.teacherId
      ? { teacherId: options.teacherId, userRole: 'student' as const }
      : undefined;

    const [attempts, quotas, teacherStudents] = await Promise.all([
      this.prisma.testAttempt.groupBy({
        by: ['userId'],
        where: {
          testId,
          status: TestAttemptStatus.submitted,
          ...(userScope ? { user: userScope } : {}),
        },
        _count: { _all: true },
      }),
      this.prisma.testAttemptQuota.findMany({
        where: {
          testId,
          ...(userScope ? { user: userScope } : {}),
        },
        select: { userId: true, extraAttempts: true, updatedAt: true },
      }),
      options?.teacherId
        ? this.prisma.user.findMany({
            where: { teacherId: options.teacherId, userRole: 'student' },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    const usedByUser = new Map(attempts.map((row) => [row.userId, row._count._all]));
    const quotaByUser = new Map(quotas.map((row) => [row.userId, row]));
    const userIds = new Set<number>([
      ...usedByUser.keys(),
      ...quotaByUser.keys(),
      ...teacherStudents.map((s) => s.id),
    ]);

    const users =
      teacherStudents.length > 0
        ? teacherStudents
        : userIds.size
          ? await this.prisma.user.findMany({
              where: { id: { in: [...userIds] } },
              select: { id: true, name: true, email: true },
              orderBy: { name: 'asc' },
            })
          : [];

    return {
      maxAttempts: test.maxAttempts,
      maxExtraAttempts: MAX_EXTRA_ATTEMPTS,
      users: users.map((user) => {
        const used = usedByUser.get(user.id) ?? 0;
        const extraAttempts = Math.min(
          MAX_EXTRA_ATTEMPTS,
          Math.max(0, quotaByUser.get(user.id)?.extraAttempts ?? 0),
        );
        const limit = test.maxAttempts + extraAttempts;
        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          attemptsUsed: used,
          extraAttempts,
          attemptsLimit: limit,
          attemptsRemaining: Math.max(0, limit - used),
          updatedAt: quotaByUser.get(user.id)?.updatedAt ?? null,
        };
      }),
    };
  }

  async setAttemptQuota(
    testId: number,
    actorId: number,
    userId: number,
    extraAttempts: number,
    options?: { teacherId?: number },
  ) {
    await this.findTest(testId);
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userRole: true, teacherId: true },
    });
    if (!target) throw new NotFoundException('Користувача не знайдено');
    if (options?.teacherId) {
      if (target.userRole !== 'student' || target.teacherId !== options.teacherId) {
        throw new ForbiddenException('Можна додавати спроби лише своїм учням');
      }
    }
    const clamped = Math.min(MAX_EXTRA_ATTEMPTS, Math.max(0, Math.floor(extraAttempts)));
    const row = await this.prisma.testAttemptQuota.upsert({
      where: { userId_testId: { userId, testId } },
      create: {
        userId,
        testId,
        extraAttempts: clamped,
        grantedById: actorId,
      },
      update: {
        extraAttempts: clamped,
        grantedById: actorId,
      },
    });
    return row;
  }

  private gradeQuestion(
    options: Array<{ id: number; kind: TestAnswerKind; isCorrect: boolean; text: string }>,
    selectedOptionIds: number[],
    writtenText?: string | null,
  ) {
    const writeIn = options.find((o) => o.kind === TestAnswerKind.write_in);
    const written = writtenText?.trim() ?? '';
    if (written && writeIn) {
      return normalizeText(written) === normalizeText(writeIn.text);
    }
    const correctIds = new Set(
      options.filter((o) => o.kind === TestAnswerKind.choice && o.isCorrect).map((o) => o.id),
    );
    const selected = new Set(selectedOptionIds);
    if (correctIds.size === 0 && !writeIn) return false;
    if (correctIds.size !== selected.size) return false;
    for (const id of correctIds) {
      if (!selected.has(id)) return false;
    }
    return true;
  }

  async submitAttempt(attemptId: number, userId: number, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        test: { include: this.fullInclude },
        answers: true,
      },
    });
    if (!attempt) throw new NotFoundException('Спробу не знайдено');
    if (attempt.status === TestAttemptStatus.submitted) {
      return this.buildReviewPayload(attempt);
    }

    try {
      await this.requireActiveGrant(attempt.testId, userId);
    } catch {
      await this.prisma.testAttempt.update({
        where: { id: attemptId },
        data: { status: TestAttemptStatus.expired },
      });
      throw new ForbiddenException('Час доступу до тесту закінчився');
    }

    const questions = attempt.test.questions;
    const answerByQ = new Map(dto.answers.map((a) => [a.questionId, a]));
    let correctCount = 0;

    await this.prisma.testAttemptAnswer.deleteMany({ where: { attemptId } });

    for (const q of questions) {
      const payload = answerByQ.get(q.id);
      const selected = payload?.selectedOptionIds ?? [];
      const written = payload?.writtenText ?? null;
      const ok = this.gradeQuestion(q.options, selected, written);
      if (ok) correctCount += 1;
      await this.prisma.testAttemptAnswer.create({
        data: {
          attemptId,
          questionId: q.id,
          selectedOptionIds: selected,
          writtenText: written,
          isCorrect: ok,
        },
      });
    }

    const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
    const updated = await this.prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: TestAttemptStatus.submitted,
        score,
        submittedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, userRole: true } },
        answers: true,
        test: { include: this.fullInclude },
      },
    });

    return this.buildReviewPayload(updated);
  }

  private buildReviewPayload(
    attempt: {
      id: number;
      testId: number;
      userId: number;
      status: TestAttemptStatus;
      score: number | null;
      startedAt: Date;
      submittedAt: Date | null;
      orderSnapshot: unknown;
      user?: { id: number; name: string; email: string; userRole: string | null };
      answers: Array<{
        questionId: number;
        selectedOptionIds: unknown;
        writtenText: string | null;
        isCorrect: boolean | null;
      }>;
      test: {
        id: number;
        title: string;
        questions: Array<{
          id: number;
          prompt: string;
          options: Array<{
            id: number;
            text: string;
            kind: TestAnswerKind;
            isCorrect: boolean;
          }>;
        }>;
      };
    },
  ) {
    const snapshot = (attempt.orderSnapshot ?? null) as OrderSnapshot | null;
    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));
    const qById = new Map(attempt.test.questions.map((q) => [q.id, q]));
    const questionIds =
      snapshot?.questionIds?.length
        ? snapshot.questionIds
        : attempt.test.questions.map((q) => q.id);

    const review = questionIds.map((qid) => {
      const q = qById.get(qid);
      if (!q) return null;
      const ans = answerMap.get(qid);
      const selected = Array.isArray(ans?.selectedOptionIds)
        ? (ans!.selectedOptionIds as number[])
        : [];
      return {
        questionId: q.id,
        prompt: q.prompt,
        isCorrect: ans?.isCorrect ?? false,
        selectedOptionIds: selected,
        writtenText: ans?.writtenText ?? null,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          kind: o.kind,
          isCorrect: o.isCorrect,
          selected: selected.includes(o.id),
        })),
      };
    }).filter(Boolean);

    return {
      id: attempt.id,
      testId: attempt.testId,
      testTitle: attempt.test.title,
      status: attempt.status,
      score: attempt.score,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      user: attempt.user,
      review,
    };
  }

  listMyAttempts(userId: number, testId?: number) {
    return this.prisma.testAttempt.findMany({
      where: {
        userId,
        ...(testId ? { testId } : {}),
        status: TestAttemptStatus.submitted,
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        testId: true,
        score: true,
        startedAt: true,
        submittedAt: true,
        test: { select: { id: true, title: true } },
      },
    });
  }

  async listMaterialTestsForChain(
    chain: ContentChainLink[],
    userId: number,
    options?: { revealPassword?: boolean; autoGrant?: boolean },
  ) {
    if (!chain.length) return [];

    const tests = await this.prisma.test.findMany({
      where: {
        kind: TestKind.material,
        OR: chain.map((link) => ({ entityType: link.entityType, entityId: link.entityId })),
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        entityType: true,
        entityId: true,
        accessDuration: true,
        entryPassword: true,
        _count: { select: { questions: true } },
      },
    });

    if (!tests.length) return [];

    const grants = await this.prisma.testAccessGrant.findMany({
      where: { userId, testId: { in: tests.map((t) => t.id) } },
    });
    const grantByTest = new Map(grants.map((g) => [g.testId, g]));

    const result = [];
    for (const test of tests) {
      const existing = grantByTest.get(test.id);
      const grant =
        options?.autoGrant
          ? await this.grantMaterialAccess(userId, test.id, test.accessDuration, existing)
          : existing;
      const unlocked = Boolean(grant && isGrantActive(grant.expiresAt));
      result.push({
        id: test.id,
        title: test.title,
        description: test.description,
        entityType: test.entityType,
        entityId: test.entityId,
        questionCount: test._count.questions,
        unlocked,
        expiresAt: unlocked ? (grant?.expiresAt ?? null) : null,
        ...(options?.revealPassword ? { entryPassword: test.entryPassword } : {}),
      });
    }
    return result;
  }

  /** Admin / curriculum views — no user grants, includes entry password. */
  async listMaterialTestsForAdminChain(chain: ContentChainLink[]) {
    if (!chain.length) return [];

    const primary = chain[0];
    const tests = await this.prisma.test.findMany({
      where: {
        kind: TestKind.material,
        OR: chain.map((link) => ({ entityType: link.entityType, entityId: link.entityId })),
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        entityType: true,
        entityId: true,
        entryPassword: true,
        accessDuration: true,
        _count: { select: { questions: true } },
      },
    });

    return tests.map((test) => ({
      id: test.id,
      title: test.title,
      description: test.description,
      entityType: test.entityType,
      entityId: test.entityId,
      questionCount: test._count.questions,
      entryPassword: test.entryPassword,
      accessDuration: test.accessDuration,
      direct: test.entityType === primary.entityType && test.entityId === primary.entityId,
    }));
  }

  private async grantMaterialAccess(
    userId: number,
    testId: number,
    accessDuration: TestAccessDuration,
    existing?: { expiresAt: Date | null } | null,
  ) {
    if (existing && isGrantActive(existing.expiresAt)) {
      return existing;
    }
    const ms = durationMs(accessDuration);
    const expiresAt = ms == null ? null : new Date(Date.now() + ms);
    return this.prisma.testAccessGrant.upsert({
      where: { userId_testId: { userId, testId } },
      create: { userId, testId, expiresAt },
      update: { grantedAt: new Date(), expiresAt },
    });
  }

  async listGrantedFreeTests(userId: number) {
    const now = new Date();
    const rows = await this.prisma.testAccessGrant.findMany({
      where: {
        userId,
        test: { kind: 'free' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { grantedAt: 'desc' },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            accessDuration: true,
            _count: { select: { questions: true } },
          },
        },
      },
    });
    return rows.map((row) => ({
      id: row.test.id,
      title: row.test.title,
      description: row.test.description,
      accessDuration: row.test.accessDuration,
      questionCount: row.test._count.questions,
      grantedAt: row.grantedAt,
      expiresAt: row.expiresAt,
    }));
  }

  async listGrants(testId: number) {
    await this.findTest(testId);
    const rows = await this.prisma.testAccessGrant.findMany({
      where: { testId },
      orderBy: { grantedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, userRole: true },
        },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      grantedAt: row.grantedAt,
      expiresAt: row.expiresAt,
      active: isGrantActive(row.expiresAt),
      user: row.user,
    }));
  }

  async adminGrant(testId: number, userId: number) {
    return this.adminGrantMany(testId, [userId]);
  }

  async adminGrantMany(testId: number, userIds: number[]) {
    const uniqueIds = [...new Set(userIds.filter((id) => Number.isInteger(id) && id > 0))];
    if (!uniqueIds.length) {
      throw new BadRequestException('Оберіть хоча б одного користувача');
    }
    const test = await this.findTest(testId);
    if (test.kind !== 'free') {
      throw new BadRequestException('Присвоїти вручну можна лише вільний тест');
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, userRole: true },
    });
    if (users.length !== uniqueIds.length) {
      throw new NotFoundException('Одного або кількох користувачів не знайдено');
    }
    for (const user of users) {
      if (user.userRole !== 'student' && user.userRole !== 'teacher') {
        throw new BadRequestException('Доступ можна видати лише учню або вчителю');
      }
    }
    await this.prisma.$transaction(
      uniqueIds.map((userId) =>
        this.prisma.testAccessGrant.upsert({
          where: { userId_testId: { userId, testId } },
          create: { userId, testId, expiresAt: null },
          update: { grantedAt: new Date(), expiresAt: null },
        }),
      ),
    );
    return this.listGrants(testId);
  }

  async adminRevokeGrant(testId: number, grantId: number) {
    await this.findTest(testId);
    const grant = await this.prisma.testAccessGrant.findFirst({
      where: { id: grantId, testId },
    });
    if (!grant) throw new NotFoundException('Доступ не знайдено');
    await this.prisma.testAccessGrant.delete({ where: { id: grant.id } });
    return this.listGrants(testId);
  }
}
