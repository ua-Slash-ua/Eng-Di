import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [users, admins, students, teachers, pages] = await Promise.all([
      this.prisma.user.count({ where: { userRole: { not: null } } }),
      this.prisma.user.count({
        where: { OR: [{ isSuperAdmin: true }, { adminRoleId: { not: null } }] },
      }),
      this.prisma.user.count({ where: { userRole: 'student' } }),
      this.prisma.user.count({ where: { userRole: 'teacher' } }),
      this.prisma.page.count(),
    ]);
    return { users, admins, students, teachers, pages };
  }
}
