import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentEntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TestsService } from '../tests/tests.service';
import { ContentChainService } from './content-chain.service';
import { ForkLessonDto } from './dto/fork-lesson.dto';
import { UpdateTeacherLessonDto } from './dto/update-teacher-lesson.dto';
import { CreateTeacherUnitDto } from './dto/create-teacher-unit.dto';
import { UpdateTeacherUnitDto } from './dto/update-teacher-unit.dto';
import { LessonPresentationsService } from './lesson-presentations.service';

@Injectable()
export class TeacherLibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presentations: LessonPresentationsService,
    private readonly chain: ContentChainService,
    private readonly tests: TestsService,
  ) {}

  /**
   * Returns the full library visible to a teacher:
   * - all content items granted via TeacherContentAccess (resolved to lessons),
   * - teacher's own forked lessons and units.
   */
  async getLibrary(userId: number, options: { includeOwn?: boolean } = {}) {
    const includeOwn = options.includeOwn !== false;
    const accesses = await this.prisma.teacherContentAccess.findMany({
      where: { teacherId: userId },
      orderBy: { grantedAt: 'desc' },
    });

    const lessonIds = new Set<number>();
    const unitIds = new Set<number>();
    const courseIds = new Set<number>();
    const levelIds = new Set<number>();

    for (const a of accesses) {
      if (a.entityType === ContentEntityType.lesson) lessonIds.add(a.entityId);
      if (a.entityType === ContentEntityType.unit) unitIds.add(a.entityId);
      if (a.entityType === ContentEntityType.course) courseIds.add(a.entityId);
      if (a.entityType === ContentEntityType.level) levelIds.add(a.entityId);
    }

    const [levels, courses, units, directLessons, ownLessons, ownUnits] = await Promise.all([
      levelIds.size
        ? this.prisma.contentLevel.findMany({
            where: { id: { in: [...levelIds] } },
            include: {
              courses: {
                include: { units: { include: { lessons: true } } },
              },
            },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          })
        : Promise.resolve([]),

      courseIds.size
        ? this.prisma.contentCourse.findMany({
            where: { id: { in: [...courseIds] } },
            include: { units: { include: { lessons: true } } },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          })
        : Promise.resolve([]),

      unitIds.size
        ? this.prisma.contentUnit.findMany({
            where: { id: { in: [...unitIds] } },
            include: { lessons: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          })
        : Promise.resolve([]),

      lessonIds.size
        ? this.prisma.contentLesson.findMany({
            where: { id: { in: [...lessonIds] } },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          })
        : Promise.resolve([]),

      includeOwn
        ? this.prisma.teacherLesson.findMany({
            where: { teacherId: userId },
            include: { sourceLesson: { select: { id: true, title: true } } },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      includeOwn
        ? this.prisma.teacherUnit.findMany({
            where: { teacherId: userId },
            include: {
              lessons: {
                include: { lesson: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    return {
      accesses,
      grantedLevels: levels,
      grantedCourses: courses,
      grantedUnits: units,
      grantedLessons: directLessons,
      ownLessons,
      ownUnits,
    };
  }

  // ── Teacher lessons (forks) ────────────────────────────────────────────────

  async getOwnLessons(teacherId: number) {
    return this.prisma.teacherLesson.findMany({
      where: { teacherId },
      include: { sourceLesson: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOwnLesson(teacherId: number, id: number) {
    const lesson = await this.prisma.teacherLesson.findUnique({
      where: { id },
      include: {
        sourceLesson: { select: { id: true, title: true } },
        presentation: true,
      },
    });
    if (!lesson || lesson.teacherId !== teacherId) {
      throw new NotFoundException('Урок не знайдено');
    }
    const { presentation, ...rest } = lesson;
    return {
      ...rest,
      presentation: presentation
        ? {
            id: presentation.id,
            originalName: presentation.originalName,
            url: presentation.url,
            mime: presentation.mime,
            sizeBytes: presentation.sizeBytes,
          }
        : null,
    };
  }

  async forkLesson(teacherId: number, dto: ForkLessonDto) {
    const source = await this.prisma.contentLesson.findUnique({
      where: { id: dto.sourceLessonId },
    });
    if (!source) throw new NotFoundException('Вихідний урок не знайдено');

    const hasAccess = await this.checkLessonAccess(teacherId, source);
    if (!hasAccess) throw new ForbiddenException('Немає доступу до цього уроку');

    const created = await this.prisma.teacherLesson.create({
      data: {
        teacherId,
        sourceLessonId: source.id,
        title: dto.title?.trim() ?? source.title,
        description: source.description,
        content: (source.content as object) ?? undefined,
      },
    });
    await this.presentations.copyToTeacherLesson(source.id, created.id);
    return created;
  }

  async updateOwnLesson(teacherId: number, id: number, dto: UpdateTeacherLessonDto) {
    const lesson = await this.prisma.teacherLesson.findUnique({ where: { id } });
    if (!lesson || lesson.teacherId !== teacherId) throw new NotFoundException('Урок не знайдено');

    return this.prisma.teacherLesson.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() ?? null } : {}),
        ...(dto.content !== undefined ? { content: (dto.content as object) ?? null } : {}),
      },
      include: {
        sourceLesson: { select: { id: true, title: true } },
        presentation: true,
      },
    }).then((lesson) => {
      const { presentation, ...rest } = lesson;
      return {
        ...rest,
        presentation: presentation
          ? {
              id: presentation.id,
              originalName: presentation.originalName,
              url: presentation.url,
              mime: presentation.mime,
              sizeBytes: presentation.sizeBytes,
            }
          : null,
      };
    });
  }

  async removeOwnLesson(teacherId: number, id: number) {
    const lesson = await this.prisma.teacherLesson.findUnique({ where: { id } });
    if (!lesson || lesson.teacherId !== teacherId) throw new NotFoundException('Урок не знайдено');
    await this.prisma.teacherLesson.delete({ where: { id } });
    return { ok: true };
  }

  // ── Teacher units ──────────────────────────────────────────────────────────

  async getOwnUnits(teacherId: number) {
    return this.prisma.teacherUnit.findMany({
      where: { teacherId },
      include: {
        lessons: {
          include: { lesson: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOwnUnit(teacherId: number, dto: CreateTeacherUnitDto) {
    const lessonIds = dto.lessonIds ?? [];

    if (lessonIds.length) {
      const owned = await this.prisma.teacherLesson.findMany({
        where: { id: { in: lessonIds }, teacherId },
        select: { id: true },
      });
      if (owned.length !== lessonIds.length) {
        throw new ForbiddenException('Один або кілька уроків не знайдено або не є вашими');
      }
    }

    return this.prisma.teacherUnit.create({
      data: {
        teacherId,
        sourceUnitId: dto.sourceUnitId ?? null,
        title: dto.title.trim(),
        mode: dto.mode,
        lessons: {
          create: lessonIds.map((lessonId, idx) => ({ lessonId, sortOrder: idx })),
        },
      },
      include: { lessons: { include: { lesson: true }, orderBy: { sortOrder: 'asc' } } },
    });
  }

  async updateOwnUnit(teacherId: number, id: number, dto: UpdateTeacherUnitDto) {
    const unit = await this.prisma.teacherUnit.findUnique({ where: { id } });
    if (!unit || unit.teacherId !== teacherId) throw new NotFoundException('Юніт не знайдено');

    await this.prisma.teacherUnit.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
      },
    });

    if (dto.lessonIds !== undefined) {
      const lessonIds = dto.lessonIds;
      if (lessonIds.length) {
        const owned = await this.prisma.teacherLesson.findMany({
          where: { id: { in: lessonIds }, teacherId },
          select: { id: true },
        });
        if (owned.length !== lessonIds.length) {
          throw new ForbiddenException('Один або кілька уроків не знайдено або не є вашими');
        }
      }
      await this.prisma.teacherUnitLesson.deleteMany({ where: { teacherUnitId: id } });
      if (lessonIds.length) {
        await this.prisma.teacherUnitLesson.createMany({
          data: lessonIds.map((lessonId, idx) => ({ teacherUnitId: id, lessonId, sortOrder: idx })),
        });
      }
    }

    return this.prisma.teacherUnit.findUnique({
      where: { id },
      include: { lessons: { include: { lesson: true }, orderBy: { sortOrder: 'asc' } } },
    });
  }

  async removeOwnUnit(teacherId: number, id: number) {
    const unit = await this.prisma.teacherUnit.findUnique({ where: { id } });
    if (!unit || unit.teacherId !== teacherId) throw new NotFoundException('Юніт не знайдено');
    await this.prisma.teacherUnit.delete({ where: { id } });
    return { ok: true };
  }

  // ── Granted content detail ─────────────────────────────────────────────────

  async getContentDetail(
    userId: number,
    entityType: ContentEntityType,
    entityId: number,
    options: { revealPassword?: boolean } = {},
  ) {
    const chain = await this.chain.buildAccessChain(entityType, entityId);
    if (!chain) throw new NotFoundException('Матеріал не знайдено');

    const grant = await this.resolveAccess(userId, chain);
    if (!grant) throw new ForbiddenException('Немає доступу до цього матеріалу');

    const linkedTests = await this.tests.listMaterialTestsForChain(chain, userId, {
      autoGrant: true,
      revealPassword: options.revealPassword === true,
    });

    if (entityType === ContentEntityType.level) {
      const level = await this.prisma.contentLevel.findUnique({
        where: { id: entityId },
        include: {
          courses: {
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            include: { _count: { select: { units: true } } },
          },
        },
      });
      if (!level) throw new NotFoundException('Рівень не знайдено');
      return {
        entityType,
        mode: grant.mode,
        linkedTests,
        level: {
          id: level.id,
          code: level.code,
          title: level.title,
          description: level.description,
        },
        courses: level.courses.map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          unitCount: course._count.units,
        })),
      };
    }

    if (entityType === ContentEntityType.course) {
      const course = await this.prisma.contentCourse.findUnique({
        where: { id: entityId },
        include: {
          level: { select: { id: true, code: true, title: true } },
          units: {
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            include: { _count: { select: { lessons: true } } },
          },
        },
      });
      if (!course) throw new NotFoundException('Курс не знайдено');
      return {
        entityType,
        mode: grant.mode,
        linkedTests,
        level: course.level,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
        },
        units: course.units.map((unit) => ({
          id: unit.id,
          title: unit.title,
          description: unit.description,
          lessonCount: unit._count.lessons,
        })),
      };
    }

    if (entityType === ContentEntityType.unit) {
      const unit = await this.prisma.contentUnit.findUnique({
        where: { id: entityId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              level: { select: { id: true, code: true, title: true } },
            },
          },
          lessons: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        },
      });
      if (!unit) throw new NotFoundException('Юніт не знайдено');
      return {
        entityType,
        mode: grant.mode,
        linkedTests,
        level: unit.course?.level ?? null,
        course: unit.course ? { id: unit.course.id, title: unit.course.title } : null,
        unit: {
          id: unit.id,
          title: unit.title,
          description: unit.description,
        },
        lessons: unit.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
        })),
      };
    }

    const lesson = await this.prisma.contentLesson.findUnique({
      where: { id: entityId },
      include: {
        presentation: true,
        unit: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
                level: { select: { id: true, code: true, title: true } },
              },
            },
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Урок не знайдено');
    return {
      entityType,
      mode: grant.mode,
      linkedTests,
      level: lesson.unit?.course?.level ?? null,
      course: lesson.unit?.course
        ? { id: lesson.unit.course.id, title: lesson.unit.course.title }
        : null,
      unit: lesson.unit ? { id: lesson.unit.id, title: lesson.unit.title } : null,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        sortOrder: lesson.sortOrder,
        presentation: lesson.presentation
          ? {
              id: lesson.presentation.id,
              originalName: lesson.presentation.originalName,
              url: lesson.presentation.url,
              mime: lesson.presentation.mime,
              sizeBytes: lesson.presentation.sizeBytes,
            }
          : null,
      },
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async checkLessonAccess(
    teacherId: number,
    lesson: { id: number; unitId: number | null },
  ): Promise<boolean> {
    const chain = await this.chain.buildAccessChain(ContentEntityType.lesson, lesson.id);
    if (!chain) return false;
    return Boolean(await this.resolveAccess(teacherId, chain));
  }

  private async resolveAccess(
    teacherId: number,
    chain: { entityType: ContentEntityType; entityId: number }[],
  ) {
    for (const link of chain) {
      const grant = await this.prisma.teacherContentAccess.findUnique({
        where: {
          teacherId_entityType_entityId: {
            teacherId,
            entityType: link.entityType,
            entityId: link.entityId,
          },
        },
      });
      if (grant) return grant;
    }
    return null;
  }
}
