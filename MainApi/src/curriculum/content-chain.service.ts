import { Injectable } from '@nestjs/common';
import { ContentEntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ContentChainLink = { entityType: ContentEntityType; entityId: number };

@Injectable()
export class ContentChainService {
  constructor(private readonly prisma: PrismaService) {}

  async buildAccessChain(
    entityType: ContentEntityType,
    entityId: number,
  ): Promise<ContentChainLink[] | null> {
    if (entityType === ContentEntityType.level) {
      const level = await this.prisma.contentLevel.findUnique({
        where: { id: entityId },
        select: { id: true },
      });
      return level ? [{ entityType: ContentEntityType.level, entityId: level.id }] : null;
    }

    if (entityType === ContentEntityType.course) {
      const course = await this.prisma.contentCourse.findUnique({
        where: { id: entityId },
        select: { id: true, levelId: true },
      });
      if (!course) return null;
      const chain: ContentChainLink[] = [{ entityType: ContentEntityType.course, entityId: course.id }];
      if (course.levelId) {
        chain.push({ entityType: ContentEntityType.level, entityId: course.levelId });
      }
      return chain;
    }

    if (entityType === ContentEntityType.unit) {
      const unit = await this.prisma.contentUnit.findUnique({
        where: { id: entityId },
        select: { id: true, courseId: true },
      });
      if (!unit) return null;
      const chain: ContentChainLink[] = [{ entityType: ContentEntityType.unit, entityId: unit.id }];
      if (unit.courseId) {
        const course = await this.prisma.contentCourse.findUnique({
          where: { id: unit.courseId },
          select: { id: true, levelId: true },
        });
        if (course) {
          chain.push({ entityType: ContentEntityType.course, entityId: course.id });
          if (course.levelId) {
            chain.push({ entityType: ContentEntityType.level, entityId: course.levelId });
          }
        }
      }
      return chain;
    }

    return this.buildLessonChain(entityId);
  }

  async buildLessonChain(lessonId: number): Promise<ContentChainLink[] | null> {
    const lesson = await this.prisma.contentLesson.findUnique({
      where: { id: lessonId },
      select: { id: true, unitId: true },
    });
    if (!lesson) return null;

    const chain: ContentChainLink[] = [{ entityType: ContentEntityType.lesson, entityId: lesson.id }];
    if (!lesson.unitId) return chain;

    const unit = await this.prisma.contentUnit.findUnique({
      where: { id: lesson.unitId },
      select: { id: true, courseId: true },
    });
    if (!unit) return chain;

    chain.push({ entityType: ContentEntityType.unit, entityId: unit.id });
    if (!unit.courseId) return chain;

    const course = await this.prisma.contentCourse.findUnique({
      where: { id: unit.courseId },
      select: { id: true, levelId: true },
    });
    if (!course) return chain;

    chain.push({ entityType: ContentEntityType.course, entityId: course.id });
    if (course.levelId) {
      chain.push({ entityType: ContentEntityType.level, entityId: course.levelId });
    }
    return chain;
  }

  async resolveScheduledLessonChain(lesson: {
    contentLessonId: number | null;
    teacherLessonId: number | null;
  }): Promise<ContentChainLink[] | null> {
    if (lesson.contentLessonId) {
      return this.buildLessonChain(lesson.contentLessonId);
    }
    if (lesson.teacherLessonId) {
      const fork = await this.prisma.teacherLesson.findUnique({
        where: { id: lesson.teacherLessonId },
        select: { sourceLessonId: true },
      });
      if (fork?.sourceLessonId) {
        return this.buildLessonChain(fork.sourceLessonId);
      }
    }
    return null;
  }
}
