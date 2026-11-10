import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { UserPanelRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type UserBrief = {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  teacher: { id: number; name: string } | null;
};

@Injectable()
export class TeacherStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  private toBrief(user: {
    id: number;
    name: string;
    email: string;
    status: UserStatus;
    teacher?: { id: number; name: string } | null;
  }): UserBrief {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      teacher: user.teacher ? { id: user.teacher.id, name: user.teacher.name } : null,
    };
  }

  async directory(userRole?: string) {
    const role = userRole === 'teacher' || userRole === 'student' ? userRole : undefined;
    const rows = await this.prisma.user.findMany({
      where: role ? { userRole: role } : { userRole: { in: ['student', 'teacher'] } },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        teacher: { select: { id: true, name: true } },
      },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });
    return { users: rows.map((row) => this.toBrief(row)) };
  }

  async getClass(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userRole: true,
        teacher: { select: { id: true, name: true, email: true, status: true } },
        students: {
          select: { id: true, name: true, email: true, status: true },
          orderBy: [{ name: 'asc' }, { email: 'asc' }],
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    return {
      role: user.userRole,
      teacher: user.teacher ? this.toBrief(user.teacher) : null,
      students: user.students.map((row) => this.toBrief(row)),
    };
  }

  async studentForTeacher(teacherId: number, studentId: number) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { userRole: true },
    });
    if (!teacher || teacher.userRole !== 'teacher') {
      throw new ForbiddenException('Лише вчитель може переглядати картку учня');
    }
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        phone: true,
        birthDate: true,
        avatarUrl: true,
        status: true,
        userRole: true,
        teacherId: true,
        createdAt: true,
        activatedAt: true,
      },
    });
    if (!student || student.userRole !== 'student' || student.teacherId !== teacherId) {
      throw new NotFoundException('Учня не знайдено');
    }
    const counts = await this.prisma.lesson.groupBy({
      by: ['status'],
      where: { studentId, status: { not: 'cancelled' } },
      _count: { _all: true },
    });
    const byStatus = Object.fromEntries(counts.map((row) => [row.status, row._count._all]));
    const total =
      (byStatus.unscheduled ?? 0) +
      (byStatus.proposed ?? 0) +
      (byStatus.confirmed ?? 0) +
      (byStatus.done ?? 0) +
      (byStatus.missed ?? 0) +
      (byStatus.admin_skip ?? 0) +
      (byStatus.frozen ?? 0);
    return {
      id: student.id,
      name: student.name,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      email: student.email,
      phone: student.phone,
      birthDate: student.birthDate ? student.birthDate.toISOString().slice(0, 10) : null,
      avatarUrl: student.avatarUrl,
      status: student.status,
      createdAt: student.createdAt.toISOString(),
      activatedAt: student.activatedAt ? student.activatedAt.toISOString() : null,
      isActivated: student.activatedAt != null,
      lessons: {
        total,
        unscheduled: byStatus.unscheduled ?? 0,
        proposed: byStatus.proposed ?? 0,
        confirmed: byStatus.confirmed ?? 0,
        done: byStatus.done ?? 0,
        missed: byStatus.missed ?? 0,
        adminSkip: byStatus.admin_skip ?? 0,
        frozen: byStatus.frozen ?? 0,
      },
    };
  }

  async setTeacher(studentId: number, teacherId: number | null) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Користувача не знайдено');
    }
    if (student.userRole !== 'student') {
      throw new BadRequestException('Вчителя можна призначити лише учню');
    }
    if (teacherId != null) {
      if (teacherId === studentId) {
        throw new BadRequestException('Не можна призначити користувача собі');
      }
      const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
      if (!teacher || teacher.userRole !== 'teacher') {
        throw new BadRequestException('Оберіть вчителя');
      }
    }
    await this.prisma.user.update({
      where: { id: studentId },
      data: { teacherId },
    });
    return this.getClass(studentId);
  }

  async addStudent(teacherId: number, studentId: number) {
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('Користувача не знайдено');
    }
    if (teacher.userRole !== 'teacher') {
      throw new BadRequestException('Учнів можна додавати лише вчителю');
    }
    if (studentId === teacherId) {
      throw new BadRequestException('Не можна додати вчителя як учня собі');
    }
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.userRole !== 'student') {
      throw new BadRequestException('Оберіть учня');
    }
    await this.prisma.user.update({
      where: { id: studentId },
      data: { teacherId },
    });
    return this.getClass(teacherId);
  }

  async removeStudent(teacherId: number, studentId: number) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Учня не знайдено');
    }
    if (student.teacherId !== teacherId) {
      throw new BadRequestException('Цей учень не належить цьому вчителю');
    }
    await this.prisma.user.update({
      where: { id: studentId },
      data: { teacherId: null },
    });
    return this.getClass(teacherId);
  }

  async syncRole(userId: number, previousRole: UserPanelRole | null, nextRole: UserPanelRole | null) {
    if (previousRole === nextRole) return;
    if (previousRole === 'teacher' && nextRole !== 'teacher') {
      await this.prisma.user.updateMany({
        where: { teacherId: userId },
        data: { teacherId: null },
      });
    }
    if (nextRole !== 'student') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { teacherId: null },
      });
    }
  }
}
