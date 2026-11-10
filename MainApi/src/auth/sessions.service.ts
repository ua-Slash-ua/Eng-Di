import { Injectable } from '@nestjs/common';
import type { AuthPanel, AuthSession } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { authUserSummarySelect, formatAccessSummary } from '../users/user.types';

export type SessionContext = {
  panel: AuthPanel;
  ip: string | null;
  userAgent: string | null;
};

export type CreatedSession = {
  session: AuthSession;
  refreshToken: string;
};

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(userId: number, ttlMs: number, ctx: SessionContext): Promise<CreatedSession> {
    const refreshToken = randomBytes(32).toString('base64url');
    const session = await this.prisma.authSession.create({
      data: {
        userId,
        familyId: randomUUID(),
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        panel: ctx.panel,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
    return { session, refreshToken };
  }

  async rotate(refreshToken: string, ttlMs: number, ctx: SessionContext): Promise<CreatedSession | 'reuse' | null> {
    const hash = this.hashRefreshToken(refreshToken);
    const current = await this.prisma.authSession.findUnique({
      where: { refreshTokenHash: hash },
    });
    if (!current) {
      return null;
    }
    if (current.revokedAt) {
      await this.revokeFamily(current.familyId, 'reuse');
      return 'reuse';
    }
    if (current.expiresAt.getTime() <= Date.now()) {
      await this.revokeSession(current.id, 'expired');
      return null;
    }

    const nextToken = randomBytes(32).toString('base64url');
    const next = await this.prisma.authSession.create({
      data: {
        userId: current.userId,
        familyId: current.familyId,
        refreshTokenHash: this.hashRefreshToken(nextToken),
        panel: ctx.panel || current.panel,
        ip: ctx.ip ?? current.ip,
        userAgent: ctx.userAgent ?? current.userAgent,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
    await this.prisma.authSession.update({
      where: { id: current.id },
      data: {
        revokedAt: new Date(),
        revokedReason: 'rotated',
        replacedById: next.id,
      },
    });
    return { session: next, refreshToken: nextToken };
  }

  findById(id: number) {
    return this.prisma.authSession.findUnique({ where: { id } });
  }

  findByRefreshToken(token: string) {
    return this.prisma.authSession.findUnique({
      where: { refreshTokenHash: this.hashRefreshToken(token) },
    });
  }

  async assertActive(id: number) {
    const session = await this.findById(id);
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    return session;
  }

  async touch(id: number) {
    await this.prisma.authSession.updateMany({
      where: { id, lastUsedAt: { lt: new Date(Date.now() - 60_000) } },
      data: { lastUsedAt: new Date() },
    });
  }

  async revokeSession(id: number, reason: string) {
    await this.prisma.authSession.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  async revokeFamily(familyId: string, reason: string) {
    await this.prisma.authSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  async revokeUser(userId: number, reason: string, exceptSessionId?: number) {
    await this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  async revokeAll(reason: string, exceptSessionId?: number) {
    await this.prisma.authSession.updateMany({
      where: {
        revokedAt: null,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  async listActive(query: { userId?: number; page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const where = {
      revokedAt: null,
      expiresAt: { gt: new Date() },
      ...(query.userId ? { userId: query.userId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.authSession.findMany({
        where,
        include: { user: { select: authUserSummarySelect } },
        orderBy: { lastUsedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.authSession.count({ where }),
    ]);

    return {
      sessions: rows.map((row) => this.toPublic(row)),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  toPublic(
    session: AuthSession & {
      user?: {
        id: number;
        email: string;
        name: string;
        userRole: 'student' | 'teacher' | null;
        isSuperAdmin: boolean;
        adminRole: { name: string } | null;
      } | null;
    },
    currentSessionId?: number,
  ) {
    return {
      id: session.id,
      userId: session.userId,
      panel: session.panel,
      ip: session.ip,
      userAgent: session.userAgent,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      current: currentSessionId === session.id,
      user: session.user
        ? { ...session.user, accessLabel: formatAccessSummary(session.user) }
        : null,
    };
  }
}
