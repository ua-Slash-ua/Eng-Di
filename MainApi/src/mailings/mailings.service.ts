import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { csvEnum, textFilter } from '../common/filters';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  MAILING_STATUSES,
  MAILING_TYPE_LABELS,
  MAILING_TYPES,
  type MailingLogStatus,
  type MailingType,
} from './mailing.types';

export type MailingLogListQuery = {
  q?: string;
  type?: string;
  email?: string;
  user?: string;
  status?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class MailingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async record(data: {
    type: MailingType;
    email: string;
    userId?: number | null;
    status: MailingLogStatus;
    error?: string | null;
    errorRaw?: string | null;
    reason?: string;
    messageId?: string | null;
  }) {
    const email = data.email.trim().toLowerCase();
    let userId = data.userId ?? null;
    if (userId == null) {
      const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
      userId = user?.id ?? null;
    }
    const row = await this.prisma.mailingLog.create({
      data: {
        type: data.type,
        email,
        userId,
        reason: data.reason || MAILING_TYPE_LABELS[data.type],
        status: data.status,
        error: data.error?.slice(0, 500) || null,
        errorRaw: data.errorRaw?.slice(0, 8000) || data.error?.slice(0, 8000) || null,
      },
    });
    const messageId = data.messageId?.trim().replace(/^<|>$/g, '').toLowerCase();
    if (messageId) {
      await this.prisma.$executeRaw`
        UPDATE mailing_logs SET message_id = ${messageId} WHERE id = ${row.id}
      `;
    }
    return row;
  }

  async markBounced(data: {
    emails: string[];
    messageIds: string[];
    error: string;
    errorRaw: string;
  }) {
    const ids = new Set<number>();
    for (const rawId of data.messageIds) {
      const messageId = rawId.trim().replace(/^<|>$/g, '').toLowerCase();
      if (!messageId) continue;
      const rows = await this.prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM mailing_logs
        WHERE status = 'sent' AND message_id = ${messageId}
        ORDER BY id DESC
        LIMIT 1
      `;
      if (rows[0]?.id) ids.add(rows[0].id);
    }
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    for (const rawEmail of data.emails) {
      const email = rawEmail.trim().toLowerCase();
      if (!email) continue;
      const row = await this.prisma.mailingLog.findFirst({
        where: { status: 'sent', email, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (row) ids.add(row.id);
    }
    if (!ids.size) return 0;
    const result = await this.prisma.mailingLog.updateMany({
      where: { id: { in: [...ids] }, status: 'sent' },
      data: {
        status: 'failed',
        error: data.error.slice(0, 500),
        errorRaw: data.errorRaw.slice(0, 8000),
      },
    });
    return result.count;
  }

  async list(query: MailingLogListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 10));
    const and: Prisma.MailingLogWhereInput[] = [];

    const types = csvEnum(query.type, MAILING_TYPES);
    if (types) {
      and.push({ type: { in: types } });
    }

    const statuses = csvEnum(query.status, MAILING_STATUSES);
    if (statuses) {
      and.push({ status: { in: statuses } });
    }

    const email = textFilter(query.email);
    if (email) {
      and.push({ email: { contains: email } });
    }

    const user = textFilter(query.user);
    if (user) {
      and.push({
        OR: [
          { user: { name: { contains: user } } },
          { user: { email: { contains: user } } },
          { user: { firstName: { contains: user } } },
          { user: { lastName: { contains: user } } },
        ],
      });
    }

    const q = query.q?.trim();
    if (q) {
      and.push({
        OR: [
          { email: { contains: q } },
          { reason: { contains: q } },
          { user: { name: { contains: q } } },
        ],
      });
    }

    const where: Prisma.MailingLogWhereInput = and.length ? { AND: and } : {};
    const [rows, total] = await Promise.all([
      this.prisma.mailingLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.mailingLog.count({ where }),
    ]);

    return {
      logs: rows.map((row) => ({
        id: row.id,
        type: row.type,
        typeLabel: MAILING_TYPE_LABELS[row.type as MailingType] || row.reason,
        email: row.email,
        reason: row.reason,
        status: row.status,
        error: row.error,
        errorRaw: row.errorRaw || row.error,
        errorParsed: row.error,
        createdAt: row.createdAt.toISOString(),
        user: row.user,
      })),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async stats() {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeek = addDays(startToday, -6);
    const startChart = addDays(startToday, -13);

    const [byStatus, byTypeStatus, todayByStatus, weekByStatus, chartRows, failed, uniqueRows, mailingSettings] =
      await Promise.all([
        this.prisma.mailingLog.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.mailingLog.groupBy({ by: ['type', 'status'], _count: { _all: true } }),
        this.prisma.mailingLog.groupBy({
          by: ['status'],
          where: { createdAt: { gte: startToday } },
          _count: { _all: true },
        }),
        this.prisma.mailingLog.groupBy({
          by: ['status'],
          where: { createdAt: { gte: startWeek } },
          _count: { _all: true },
        }),
        this.prisma.mailingLog.findMany({
          where: { createdAt: { gte: startChart } },
          select: { createdAt: true, status: true },
        }),
        this.prisma.mailingLog.findMany({
          where: { status: 'failed' },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { id: true, type: true, email: true, error: true, createdAt: true },
        }),
        this.prisma.$queryRaw<Array<{ c: bigint | number }>>(
          Prisma.sql`SELECT COUNT(DISTINCT email) AS c FROM mailing_logs`,
        ),
        this.settings.getMailingSettings(),
      ]);

    const totals = statusCounts(byStatus);
    const today = statusCounts(todayByStatus);
    const week = statusCounts(weekByStatus);
    const attempted = totals.sent + totals.failed;
    const byTypeMap = new Map<string, { sent: number; skipped: number; failed: number; total: number }>();
    for (const type of MAILING_TYPES) {
      byTypeMap.set(type, { sent: 0, skipped: 0, failed: 0, total: 0 });
    }
    for (const row of byTypeStatus) {
      const current = byTypeMap.get(row.type) ?? { sent: 0, skipped: 0, failed: 0, total: 0 };
      const count = row._count._all;
      if (row.status === 'sent' || row.status === 'skipped' || row.status === 'failed') {
        current[row.status] += count;
      }
      current.total += count;
      byTypeMap.set(row.type, current);
    }

    const days = Array.from({ length: 14 }, (_, index) => {
      const date = addDays(startChart, index);
      const key = dateKey(date);
      return {
        date: key,
        label: `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`,
        sent: 0,
        skipped: 0,
        failed: 0,
        total: 0,
      };
    });
    const dayMap = new Map(days.map((item) => [item.date, item]));
    for (const row of chartRows) {
      const item = dayMap.get(dateKey(row.createdAt));
      if (!item) continue;
      if (row.status === 'sent' || row.status === 'skipped' || row.status === 'failed') {
        item[row.status] += 1;
      }
      item.total += 1;
    }

    const enabledTypes = MAILING_TYPES.filter((type) => mailingSettings.flags[type] !== false).length;

    return {
      totals,
      today,
      week,
      uniqueEmails: Number(uniqueRows[0]?.c ?? 0),
      moduleEnabled: mailingSettings.enabled,
      enabledTypes,
      typesTotal: MAILING_TYPES.length,
      successRate: attempted ? Math.round((totals.sent / attempted) * 100) : null,
      byType: [...byTypeMap.entries()]
        .map(([type, counts]) => ({
          type,
          typeLabel: MAILING_TYPE_LABELS[type as MailingType] || type,
          ...counts,
        }))
        .filter((item) => item.total > 0)
        .sort((a, b) => b.total - a.total),
      days,
      failed: failed.map((row) => ({
        id: row.id,
        type: row.type,
        typeLabel: MAILING_TYPE_LABELS[row.type as MailingType] || row.type,
        email: row.email,
        error: row.error,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }
}

function statusCounts(rows: Array<{ status: string; _count: { _all: number } }>) {
  const next = { sent: 0, skipped: 0, failed: 0, total: 0 };
  for (const row of rows) {
    if (row.status === 'sent' || row.status === 'skipped' || row.status === 'failed') {
      next[row.status] = row._count._all;
    }
    next.total += row._count._all;
  }
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
