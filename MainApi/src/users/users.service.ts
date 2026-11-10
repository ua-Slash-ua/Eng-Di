import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import type { Prisma, UserPanelRole, User, UserStatus } from '@prisma/client';

import * as bcrypt from 'bcryptjs';

import { randomBytes } from 'crypto';

import { csvEnum, textFilter } from '../common/filters';

import { PrismaService } from '../prisma/prisma.service';

import type { AdminUser, PublicUser } from './user.types';

import { toAdminUser, toPublicUser } from './user.mapper';



export type UserListQuery = {

  q?: string;

  /** Comma separated user panel roles: student, teacher */

  userRole?: string;

  /** Comma separated admin filters: super_admin, admin */

  adminAccess?: string;

  status?: string;

  user?: string;

  phone?: string;

  page?: number;

  limit?: number;

};



const userWithRoleInclude = {

  adminRole: {

    include: {

      permissions: {

        include: { permission: true },

      },

    },

  },

} as const;



@Injectable()

export class UsersService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly config: ConfigService,

  ) {}



  pendingTtlMs() {

    const hours = Number(this.config.get<string>('PENDING_ACCOUNT_TTL_HOURS') ?? '24');

    const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 24;

    return safeHours * 60 * 60 * 1000;

  }



  findByEmail(email: string) {

    return this.prisma.user.findUnique({

      where: { email },

      include: userWithRoleInclude,

    });

  }



  findById(id: number) {

    return this.prisma.user.findUnique({

      where: { id },

      include: userWithRoleInclude,

    });

  }



  createUser(data: {

    email: string;

    name: string;

    firstName?: string | null;

    lastName?: string | null;

    middleName?: string | null;

    birthDate?: Date | null;

    passwordHash: string;

    userRole?: UserPanelRole | null;

    isSuperAdmin?: boolean;

    phone?: string | null;

    adminRoleId?: number | null;

    activatedAt?: Date | null;

    pendingPassword?: string | null;

  }) {

    return this.prisma.user.create({

      data: {

        email: data.email,

        name: data.name,

        firstName: data.firstName ?? null,

        lastName: data.lastName ?? null,

        middleName: data.middleName ?? null,

        birthDate: data.birthDate ?? null,

        passwordHash: data.passwordHash,

        userRole: data.userRole ?? null,

        isSuperAdmin: data.isSuperAdmin ?? false,

        phone: data.phone ?? null,

        adminRoleId: data.adminRoleId ?? null,

        activatedAt: data.activatedAt ?? null,

        pendingPassword: data.pendingPassword ?? null,

      },

      include: userWithRoleInclude,

    });

  }



  async createWithTemporaryPassword(data: {

    email: string;

    firstName?: string;

    lastName?: string;

    middleName?: string | null;

    birthDate?: Date | null;

    name?: string;

    userRole?: UserPanelRole | null;

    isSuperAdmin?: boolean;

    adminRoleId?: number | null;

  }) {

    await this.purgeExpiredPendingUsers();

    const email = data.email.trim().toLowerCase();

    const temporaryPassword = `EngDi-${randomBytes(4).toString('hex')}`;

    const fullName = this.composeFullName(data.firstName, data.lastName, data.middleName);
    const name = fullName || data.name?.trim() || email.split('@')[0];

    const user = await this.createUser({

      email,

      name,

      firstName: data.firstName?.trim() || null,

      lastName: data.lastName?.trim() || null,

      middleName: data.middleName?.trim() || null,

      birthDate: data.birthDate ?? null,

      userRole: data.userRole ?? null,

      isSuperAdmin: data.isSuperAdmin ?? false,

      adminRoleId: data.adminRoleId ?? null,

      passwordHash: await bcrypt.hash(temporaryPassword, 12),

      activatedAt: null,

      pendingPassword: temporaryPassword,

    });

    return { user, temporaryPassword };

  }



  async activateIfPending(id: number) {

    const existing = await this.findById(id);

    if (!existing || existing.activatedAt) {

      return existing;

    }

    return this.prisma.user.update({

      where: { id },

      data: { activatedAt: new Date(), pendingPassword: null },

      include: userWithRoleInclude,

    });

  }



  async purgeExpiredPendingUsers() {

    const cutoff = new Date(Date.now() - this.pendingTtlMs());

    await this.prisma.user.deleteMany({

      where: {

        activatedAt: null,

        createdAt: { lt: cutoff },

      },

    });

  }



  updateProfile(
    id: number,
    data: {
      firstName: string;
      lastName: string;
      middleName?: string | null;
      birthDate?: Date | null;
      phone?: string | null;
    },
  ) {

    const name = this.composeFullName(data.firstName, data.lastName, data.middleName) || data.firstName;

    return this.prisma.user.update({

      where: { id },

      data: {

        name,

        firstName: data.firstName,

        lastName: data.lastName,

        middleName: data.middleName ?? null,

        birthDate: data.birthDate ?? null,

        phone: data.phone ?? null,

      },

      include: userWithRoleInclude,

    });

  }

  updateAvatar(id: number, avatarUrl: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      include: userWithRoleInclude,
    });
  }



  async setPassword(id: number, password: string) {

    return this.prisma.user.update({

      where: { id },

      data: { passwordHash: await bcrypt.hash(password, 12) },

      include: userWithRoleInclude,

    });

  }



  async setStatus(id: number, status: UserStatus) {

    const existing = await this.findById(id);

    if (!existing) {

      throw new NotFoundException('Користувача не знайдено');

    }

    return this.prisma.user.update({

      where: { id },

      data: { status },

      include: userWithRoleInclude,

    });

  }



  setStatusWhere(status: UserStatus, where: Prisma.UserWhereInput) {

    return this.prisma.user.updateMany({ where, data: { status } });

  }



  async resetWithTemporaryPassword(id: number) {

    const existing = await this.findById(id);

    if (!existing) {

      throw new NotFoundException('Користувача не знайдено');

    }

    const temporaryPassword = `EngDi-${randomBytes(4).toString('hex')}`;

    const user = await this.prisma.user.update({

      where: { id },

      data: {

        passwordHash: await bcrypt.hash(temporaryPassword, 12),

        ...(existing.activatedAt ? {} : { pendingPassword: temporaryPassword }),

      },

      include: userWithRoleInclude,

    });

    return { user, temporaryPassword };

  }



  async list(query: UserListQuery) {

    await this.purgeExpiredPendingUsers();

    const page = Math.max(1, query.page ?? 1);

    const limit = Math.min(50, Math.max(1, query.limit ?? 10));

    const and: Prisma.UserWhereInput[] = [];

    const userRoles = csvEnum(query.userRole, ['student', 'teacher'] as const);

    if (userRoles) {

      and.push({ userRole: { in: userRoles as UserPanelRole[] } });

    }

    const adminAccess = csvEnum(query.adminAccess, ['super_admin', 'admin'] as const);

    if (adminAccess) {

      const or: Prisma.UserWhereInput[] = [];

      if (adminAccess.includes('super_admin')) {

        or.push({ isSuperAdmin: true });

      }

      if (adminAccess.includes('admin')) {

        or.push({ adminRoleId: { not: null }, isSuperAdmin: false });

      }

      if (or.length) {

        and.push(or.length === 1 ? or[0] : { OR: or });

      }

    }

    const statuses = csvEnum(query.status, ['active', 'blocked'] as const);

    if (statuses) {

      and.push({ status: { in: statuses } });

    }

    const q = query.q?.trim();

    if (q) {

      and.push({
        OR: [
          { name: { contains: q } },
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { middleName: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      });

    }

    const user = textFilter(query.user);

    if (user) {

      and.push({
        OR: [
          { name: { contains: user } },
          { firstName: { contains: user } },
          { lastName: { contains: user } },
          { middleName: { contains: user } },
          { email: { contains: user } },
        ],
      });

    }

    const phone = textFilter(query.phone);

    if (phone) {

      and.push({ phone: { contains: phone } });

    }

    const where: Prisma.UserWhereInput = and.length ? { AND: and } : {};



    const [rows, total] = await Promise.all([

      this.prisma.user.findMany({

        where,

        orderBy: { id: 'desc' },

        skip: (page - 1) * limit,

        take: limit,

        include: userWithRoleInclude,

      }),

      this.prisma.user.count({ where }),

    ]);



    const ttlMs = this.pendingTtlMs();

    return {

      users: rows.map((row) => this.toAdminPublic(row, ttlMs)),

      total,

      page,

      limit,

      pages: Math.max(1, Math.ceil(total / limit)),

    };

  }



  async deleteById(id: number) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Користувача не знайдено');
    }
    if (existing.isSuperAdmin) {
      const superAdminCount = await this.prisma.user.count({ where: { isSuperAdmin: true } });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Не можна видалити останнього супер-адміна');
      }
    }
    await this.prisma.user.delete({ where: { id } });
    return { ok: true as const };
  }

  async adminUpdate(

    id: number,

    data: {

      email?: string;

      name?: string;

      firstName?: string;

      lastName?: string;

      middleName?: string | null;

      birthDate?: Date | null;

      phone?: string | null;

      userRole?: UserPanelRole | null;

      isSuperAdmin?: boolean;

      adminRoleId?: number | null;

    },

  ) {

    const existing = await this.findById(id);

    if (!existing) {

      throw new NotFoundException('Користувача не знайдено');

    }



    if (data.email) {

      const email = data.email.trim().toLowerCase();

      const taken = await this.findByEmail(email);

      if (taken && taken.id !== id) {

        throw new ConflictException('Користувач з таким email вже існує');

      }

    }



    const nextIsSuperAdmin = data.isSuperAdmin ?? existing.isSuperAdmin;

    let adminRoleId = data.adminRoleId;

    if (data.adminRoleId === undefined && data.isSuperAdmin === true) {

      adminRoleId = null;

    }

    if (nextIsSuperAdmin) {

      adminRoleId = null;

    }



    const nextRole = data.userRole !== undefined ? data.userRole : existing.userRole;

    if (existing.userRole === 'teacher' && nextRole !== 'teacher') {

      await this.prisma.user.updateMany({

        where: { teacherId: id },

        data: { teacherId: null },

      });

    }



    const nextFirstName =
      data.firstName !== undefined ? data.firstName.trim() : (existing.firstName ?? undefined);
    const nextLastName = data.lastName !== undefined ? data.lastName.trim() : (existing.lastName ?? undefined);
    const nextMiddleName =
      data.middleName !== undefined ? (data.middleName?.trim() || null) : existing.middleName;
    const composedName =
      nextFirstName && nextLastName
        ? this.composeFullName(nextFirstName, nextLastName, nextMiddleName)
        : null;

    return this.prisma.user.update({

      where: { id },

      data: {

        ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),

        ...(data.name ? { name: data.name.trim() } : {}),

        ...(data.firstName !== undefined ? { firstName: data.firstName.trim() } : {}),

        ...(data.lastName !== undefined ? { lastName: data.lastName.trim() } : {}),

        ...(data.middleName !== undefined ? { middleName: data.middleName?.trim() || null } : {}),

        ...(data.birthDate !== undefined ? { birthDate: data.birthDate } : {}),

        ...(composedName ? { name: composedName } : {}),

        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),

        ...(data.userRole !== undefined ? { userRole: data.userRole } : {}),

        ...(data.isSuperAdmin !== undefined ? { isSuperAdmin: data.isSuperAdmin } : {}),

        ...(adminRoleId !== undefined ? { adminRoleId } : {}),

        ...(data.userRole !== undefined && data.userRole !== 'student' ? { teacherId: null } : {}),

      },

      include: userWithRoleInclude,

    });

  }



  toPublic(user: Parameters<typeof toPublicUser>[0]): PublicUser {

    return toPublicUser(user);

  }



  toAdminPublic(user: Parameters<typeof toAdminUser>[0], ttlMs = this.pendingTtlMs()): AdminUser {

    return toAdminUser(user, ttlMs);

  }

  private composeFullName(firstName?: string | null, lastName?: string | null, middleName?: string | null) {
    return [lastName?.trim(), firstName?.trim(), middleName?.trim()].filter(Boolean).join(' ');
  }

}

