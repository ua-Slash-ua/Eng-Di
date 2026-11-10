import { Injectable } from '@nestjs/common';
import type { AuthEventType, AuthPanel, Prisma } from '@prisma/client';
import { csvEnum, textFilter } from '../common/filters';
import { PrismaService } from '../prisma/prisma.service';
import { authUserSummarySelect, formatAccessSummary } from '../users/user.types';

export type AuthEventInput = {
  userId?: number | null;
  sessionId?: number | null;
  type: AuthEventType;
  panel?: AuthPanel | null;
  path?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Prisma.InputJsonValue;
};

export type AuthEventListQuery = {
  q?: string;
  type?: string;
  panel?: string;
  userId?: number;
  path?: string;
  page?: number;
  limit?: number;
};

const EVENT_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'LOGOUT_ALL',
  'REFRESH',
  'REFRESH_REUSE',
  'SESSION_REVOKED',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET',
  'PROFILE_UPDATED',
  'ACCOUNT_CREATED',
  'ACCOUNT_BLOCKED',
  'ACCOUNT_UNBLOCKED',
  'PAGE_VIEW',
] as const;

@Injectable()
export class AuthEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuthEventInput) {
    try {
      await this.prisma.authEvent.create({
        data: {
          userId: input.userId ?? null,
          sessionId: input.sessionId ?? null,
          type: input.type,
          panel: input.panel ?? null,
          path: input.path ? input.path.slice(0, 180) : null,
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
          meta: input.meta ?? undefined,
        },
      });
    } catch (error) {
      console.error('Failed to record auth event', error);
    }
  }

  async recordPageView(input: Omit<AuthEventInput, 'type'> & { path: string }) {
    const path = normalizePath(input.path);
    if (!path) {
      return;
    }
    const since = new Date(Date.now() - 2000);
    const duplicate = await this.prisma.authEvent.findFirst({
      where: {
        type: 'PAGE_VIEW',
        path,
        createdAt: { gte: since },
        ...(input.userId ? { userId: input.userId } : { userId: null, ip: input.ip ?? null }),
      },
      select: { id: true },
    });
    if (duplicate) {
      return;
    }
    await this.record({ ...input, type: 'PAGE_VIEW', path });
  }

  async list(query: AuthEventListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const and: Prisma.AuthEventWhereInput[] = [];
    const types = csvEnum(query.type, EVENT_TYPES);
    if (types) {
      and.push({ type: { in: types } });
    }
    const panels = csvEnum(query.panel, ['user', 'admin'] as const);
    if (panels) {
      and.push({ panel: { in: panels } });
    }
    if (query.userId) {
      and.push({ userId: query.userId });
    }
    const path = textFilter(query.path);
    if (path) {
      and.push({ path: { contains: path } });
    }
    const q = query.q?.trim();
    if (q) {
      and.push({
        OR: [
          { path: { contains: q } },
          { ip: { contains: q } },
          { user: { is: { OR: [{ email: { contains: q } }, { name: { contains: q } }] } } },
        ],
      });
    }
    const where: Prisma.AuthEventWhereInput = and.length ? { AND: and } : {};

    const [rows, total] = await Promise.all([
      this.prisma.authEvent.findMany({
        where,
        include: {
          user: { select: authUserSummarySelect },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.authEvent.count({ where }),
    ]);

    return {
      events: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        sessionId: row.sessionId,
        type: row.type,
        panel: row.panel,
        path: row.path,
        ip: row.ip,
        userAgent: row.userAgent,
        meta: row.meta,
        createdAt: row.createdAt.toISOString(),
        user: row.user
          ? {
              ...row.user,
              accessLabel: formatAccessSummary(row.user),
            }
          : null,
      })),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async summary() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const [
      activeSessions,
      blockedUsers,
      loginsToday,
      loginsWeek,
      failedLoginsToday,
      homeViews,
      cabinetViews,
    ] = await Promise.all([
      this.prisma.authSession.count({
        where: { revokedAt: null, expiresAt: { gt: now } },
      }),
      this.prisma.user.count({ where: { status: 'blocked' } }),
      this.prisma.authEvent.count({
        where: { type: 'LOGIN_SUCCESS', createdAt: { gte: startOfToday } },
      }),
      this.prisma.authEvent.count({
        where: { type: 'LOGIN_SUCCESS', createdAt: { gte: weekAgo } },
      }),
      this.prisma.authEvent.count({
        where: { type: 'LOGIN_FAILED', createdAt: { gte: startOfToday } },
      }),
      this.prisma.authEvent.count({
        where: { type: 'PAGE_VIEW', path: '/' },
      }),
      this.prisma.authEvent.count({
        where: { type: 'PAGE_VIEW', path: { startsWith: '/cabinet' } },
      }),
    ]);

    return {
      activeSessions,
      blockedUsers,
      loginsToday,
      loginsWeek,
      failedLoginsToday,
      homeViews,
      cabinetViews,
    };
  }

  async overview() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const [
      summary,
      totalUsers,
      students,
      admins,
      activeAccounts,
      newUsersToday,
      newUsersWeek,
      neverLoggedIn,
      uniqueLoginsToday,
      uniqueLoginsWeek,
      logoutsToday,
      pageViewsToday,
      pageViewsWeek,
      homeViewsToday,
      cabinetViewsToday,
      passwordChangesWeek,
      onlineUsers,
      topLogins,
      topCabinet,
      topHome,
    ] = await Promise.all([
      this.summary(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { userRole: 'student' } }),
      this.prisma.user.count({
        where: { OR: [{ isSuperAdmin: true }, { adminRoleId: { not: null } }] },
      }),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({
        where: { events: { none: { type: 'LOGIN_SUCCESS' } } },
      }),
      this.uniqueUsers({ type: 'LOGIN_SUCCESS', createdAt: { gte: startOfToday } }),
      this.uniqueUsers({ type: 'LOGIN_SUCCESS', createdAt: { gte: weekAgo } }),
      this.prisma.authEvent.count({
        where: { type: 'LOGOUT', createdAt: { gte: startOfToday } },
      }),
      this.prisma.authEvent.count({
        where: { type: 'PAGE_VIEW', createdAt: { gte: startOfToday } },
      }),
      this.prisma.authEvent.count({
        where: { type: 'PAGE_VIEW', createdAt: { gte: weekAgo } },
      }),
      this.prisma.authEvent.count({
        where: { type: 'PAGE_VIEW', path: '/', createdAt: { gte: startOfToday } },
      }),
      this.prisma.authEvent.count({
        where: { type: 'PAGE_VIEW', path: { startsWith: '/cabinet' }, createdAt: { gte: startOfToday } },
      }),
      this.prisma.authEvent.count({
        where: { type: 'PASSWORD_CHANGED', createdAt: { gte: weekAgo } },
      }),
      this.prisma.authSession.findMany({
        where: { revokedAt: null, expiresAt: { gt: now } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.topUsers('LOGIN_SUCCESS'),
      this.topUsers('PAGE_VIEW', { path: { startsWith: '/cabinet' } }),
      this.topUsers('PAGE_VIEW', { path: '/' }),
    ]);

    return {
      ...summary,
      totalUsers,
      students,
      admins,
      activeAccounts,
      newUsersToday,
      newUsersWeek,
      neverLoggedIn,
      uniqueLoginsToday,
      uniqueLoginsWeek,
      logoutsToday,
      pageViewsToday,
      pageViewsWeek,
      homeViewsToday,
      cabinetViewsToday,
      passwordChangesWeek,
      onlineNow: onlineUsers.length,
      topLogins,
      topCabinet,
      topHome,
    };
  }

  private async uniqueUsers(where: Prisma.AuthEventWhereInput) {
    const rows = await this.prisma.authEvent.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
    });
    return rows.length;
  }

  private async topUsers(type: AuthEventType, extra: Prisma.AuthEventWhereInput = {}, take = 5) {
    const rows = await this.prisma.authEvent.groupBy({
      by: ['userId'],
      where: { type, userId: { not: null }, ...extra },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take,
    });
    const ids = rows.map((row) => row.userId).filter((id): id is number => id != null);
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: authUserSummarySelect,
    });
    const byId = new Map(
      users.map((user) => [
        user.id,
        { ...user, accessLabel: formatAccessSummary(user) },
      ]),
    );
    return rows.map((row) => ({
      count: row._count.userId,
      user: row.userId ? byId.get(row.userId) ?? null : null,
    }));
  }

  async userStats(userId: number) {
    const [loginCount, failedLoginCount, homeViews, cabinetViews, lastLogin] = await Promise.all([
      this.prisma.authEvent.count({ where: { userId, type: 'LOGIN_SUCCESS' } }),
      this.prisma.authEvent.count({ where: { userId, type: 'LOGIN_FAILED' } }),
      this.prisma.authEvent.count({ where: { userId, type: 'PAGE_VIEW', path: '/' } }),
      this.prisma.authEvent.count({
        where: { userId, type: 'PAGE_VIEW', path: { startsWith: '/cabinet' } },
      }),
      this.prisma.authEvent.findFirst({
        where: { userId, type: 'LOGIN_SUCCESS' },
        orderBy: { id: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      loginCount,
      failedLoginCount,
      homeViews,
      cabinetViews,
      lastLoginAt: lastLogin?.createdAt.toISOString() ?? null,
    };
  }
}

function normalizePath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }
  const withoutQuery = trimmed.split('?')[0].split('#')[0];
  if (withoutQuery === '/login') {
    return null;
  }
  return withoutQuery.slice(0, 180);
}
