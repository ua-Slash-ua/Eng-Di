import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import type { AuthUser } from '../users/user.types';
import { AdminPanelGuard } from './admin-panel.guard';
import { AuthEventsService } from './auth-events.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Permissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';
import { getRequestIp, getRequestPanel, getUserAgent } from './request-context';
import { SessionsService } from './sessions.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminAuthController {
  constructor(
    private readonly users: UsersService,
    private readonly sessions: SessionsService,
    private readonly events: AuthEventsService,
  ) {}

  @Get('auth/summary')
  @Permissions('analytics.read')
  summary() {
    return this.events.summary();
  }

  @Get('auth/overview')
  @Permissions('analytics.read')
  overview() {
    return this.events.overview();
  }

  @Get('auth/events')
  @Permissions('auth.read')
  listEvents(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('panel') panel?: string,
    @Query('userId') userId?: string,
    @Query('path') path?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.events.list({
      q,
      type,
      panel,
      path,
      userId: Number(userId) || undefined,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Get('auth/sessions')
  @Permissions('auth.read')
  listSessions(
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sessions.listActive({
      userId: Number(userId) || undefined,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Post('auth/logout-all')
  @Permissions('auth.read')
  async logoutAll(@Req() req: Request & { user: AuthUser }) {
    await this.sessions.revokeAll('admin_logout_all', req.user.sessionId);
    await this.events.record({
      userId: req.user.id,
      sessionId: req.user.sessionId,
      type: 'LOGOUT_ALL',
      panel: getRequestPanel(req),
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
      meta: { scope: 'global', keepCurrent: true },
    });
    return { ok: true };
  }

  @Post('auth/unblock-all')
  @Permissions('users.write')
  async unblockAll(@Req() req: Request & { user: AuthUser }) {
    const result = await this.users.setStatusWhere('active', { status: 'blocked' });
    await this.events.record({
      userId: req.user.id,
      sessionId: req.user.sessionId,
      type: 'ACCOUNT_UNBLOCKED',
      panel: getRequestPanel(req),
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
      meta: { scope: 'global', count: result.count },
    });
    return { ok: true, count: result.count };
  }

  @Post('sessions/:id/revoke')
  @Permissions('auth.read')
  async revokeSession(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthUser },
  ) {
    const session = await this.sessions.findById(id);
    if (!session || session.revokedAt) {
      throw new NotFoundException('Сесію не знайдено');
    }
    await this.sessions.revokeSession(id, 'admin_revoke');
    await this.events.record({
      userId: session.userId,
      sessionId: id,
      type: 'SESSION_REVOKED',
      panel: getRequestPanel(req),
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
      meta: { actorId: req.user.id },
    });
    return { ok: true };
  }

  @Get('users/:id/auth')
  @Permissions('auth.read')
  async userAuth(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthUser },
  ) {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    const [stats, sessions, events] = await Promise.all([
      this.events.userStats(id),
      this.sessions.listActive({ userId: id, page: 1, limit: 20 }),
      this.events.list({ userId: id, page: 1, limit: 20 }),
    ]);
    return {
      user: this.users.toAdminPublic(user),
      stats,
      sessions: sessions.sessions.map((session) => ({
        ...session,
        current: session.id === req.user.sessionId,
      })),
      events: events.events,
    };
  }

  @Post('users/:id/logout')
  @Permissions('users.write')
  async logoutUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthUser },
  ) {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    const except = req.user.id === id ? req.user.sessionId : undefined;
    await this.sessions.revokeUser(id, 'admin_logout', except);
    await this.events.record({
      userId: id,
      sessionId: req.user.sessionId,
      type: 'LOGOUT_ALL',
      panel: getRequestPanel(req),
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
      meta: { actorId: req.user.id, keepCurrent: Boolean(except) },
    });
    return { ok: true };
  }

  @Post('users/:id/block')
  @Permissions('users.write')
  async blockUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthUser },
  ) {
    if (req.user.id === id) {
      throw new BadRequestException('Не можна заблокувати свій акаунт');
    }
    const user = await this.users.setStatus(id, 'blocked');
    await this.sessions.revokeUser(id, 'blocked');
    await this.events.record({
      userId: id,
      sessionId: req.user.sessionId,
      type: 'ACCOUNT_BLOCKED',
      panel: getRequestPanel(req),
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
      meta: { actorId: req.user.id },
    });
    return { user: this.users.toAdminPublic(user) };
  }

  @Post('users/:id/unblock')
  @Permissions('users.write')
  async unblockUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthUser },
  ) {
    const user = await this.users.setStatus(id, 'active');
    await this.events.record({
      userId: id,
      sessionId: req.user.sessionId,
      type: 'ACCOUNT_UNBLOCKED',
      panel: getRequestPanel(req),
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
      meta: { actorId: req.user.id },
    });
    return { user: this.users.toAdminPublic(user) };
  }

  @Post('users/:id/reset-password')
  @Permissions('users.write')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthUser },
  ) {
    const { user, temporaryPassword } = await this.users.resetWithTemporaryPassword(id);
    const except = req.user.id === id ? req.user.sessionId : undefined;
    await this.sessions.revokeUser(id, 'password_reset', except);
    await this.events.record({
      userId: id,
      sessionId: req.user.sessionId,
      type: 'PASSWORD_RESET',
      panel: getRequestPanel(req),
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
      meta: { actorId: req.user.id },
    });
    return { user: this.users.toAdminPublic(user), temporaryPassword };
  }
}
