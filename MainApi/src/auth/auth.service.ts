import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import type { UserPanelRole } from '@prisma/client';
import type { AuthUser, PublicUser } from '../users/user.types';
import { hasAdminPanelAccess, hasUserPanelAccess } from '../users/user.types';
import { AuthEventsService } from './auth-events.service';
import type { AccessPayload } from './access-payload';
import {
  LEGACY_ACCESS_COOKIE,
  LEGACY_REFRESH_COOKIE,
  accessCookieName,
  readAccessToken,
  readRefreshToken,
  refreshCookieName,
} from './cookies';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { parseDurationMs } from './duration';
import { LoginRateLimit } from './login-rate-limit';
import { getRequestIp, getRequestPanel, getUserAgent } from './request-context';
import { SessionsService } from './sessions.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailingsMailerService } from '../mailings/mailings.mailer';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, extname, join } from 'path';

@Injectable()
export class AuthService {
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;
  private readonly accessTtlMs: number;
  private readonly refreshTtlMs: number;
  private readonly cookieSecure: boolean;
  private readonly avatarMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  private readonly avatarMaxBytes = 5 * 1024 * 1024;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly sessions: SessionsService,
    private readonly events: AuthEventsService,
    private readonly rateLimit: LoginRateLimit,
    private readonly mailingsMailer: MailingsMailerService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.accessExpiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    this.refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d';
    this.accessTtlMs = parseDurationMs(this.accessExpiresIn, 15 * 60 * 1000);
    this.refreshTtlMs = parseDurationMs(this.refreshExpiresIn, 30 * 24 * 60 * 60 * 1000);
    this.cookieSecure =
      this.config.get<string>('COOKIE_SECURE') === 'true' || process.env.NODE_ENV === 'production';
  }

  async login(dto: LoginDto, req: Request, res: Response) {
    const email = dto.email.trim().toLowerCase();
    const ctx = this.context(req);
    const rateKey = `${ctx.ip ?? 'unknown'}|${email}`;
    this.rateLimit.assert(rateKey);

    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      this.rateLimit.fail(rateKey);
      await this.events.record({
        userId: user?.id ?? null,
        type: 'LOGIN_FAILED',
        panel: ctx.panel,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        meta: { email },
      });
      throw new UnauthorizedException('Невірний email або пароль');
    }

    if (user.status === 'blocked') {
      this.rateLimit.fail(rateKey);
      await this.events.record({
        userId: user.id,
        type: 'LOGIN_FAILED',
        panel: ctx.panel,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        meta: { reason: 'blocked' },
      });
      throw new ForbiddenException('Акаунт заблоковано');
    }

    this.assertPanelAccess(user, ctx.panel);

    this.rateLimit.success(rateKey);
    const activated = (await this.users.activateIfPending(user.id)) ?? user;
    const { session, refreshToken } = await this.sessions.create(activated.id, this.refreshTtlMs, ctx);
    this.setAuthCookies(res, this.signAccess(activated.id, session.id), refreshToken, ctx.panel);
    await this.events.record({
      userId: activated.id,
      sessionId: session.id,
      type: 'LOGIN_SUCCESS',
      panel: ctx.panel,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { user: this.users.toPublic(activated) };
  }

  async refresh(req: Request, res: Response) {
    const ctx = this.context(req);
    const refreshToken = readRefreshToken(req, ctx.panel);
    if (!refreshToken) {
      throw new UnauthorizedException('Потрібна авторизація');
    }
    const rotated = await this.sessions.rotate(refreshToken, this.refreshTtlMs, ctx);
    if (rotated === 'reuse') {
      this.clearAuthCookies(res, ctx.panel);
      await this.events.record({
        type: 'REFRESH_REUSE',
        panel: ctx.panel,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw new UnauthorizedException('Сесію відкликано');
    }
    if (!rotated) {
      this.clearAuthCookies(res, ctx.panel);
      throw new UnauthorizedException('Потрібна авторизація');
    }

    const user = await this.users.findById(rotated.session.userId);
    if (!user || user.status === 'blocked') {
      await this.sessions.revokeSession(rotated.session.id, 'blocked');
      this.clearAuthCookies(res, ctx.panel);
      throw new UnauthorizedException('Потрібна авторизація');
    }

    try {
      this.assertPanelAccess(user, ctx.panel);
    } catch (error) {
      await this.sessions.revokeSession(rotated.session.id, 'no-access');
      this.clearAuthCookies(res, ctx.panel);
      throw error;
    }

    this.setAuthCookies(res, this.signAccess(user.id, rotated.session.id), rotated.refreshToken, ctx.panel);
    await this.events.record({
      userId: user.id,
      sessionId: rotated.session.id,
      type: 'REFRESH',
      panel: ctx.panel,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { user: this.users.toPublic(user) };
  }

  async resolveMe(req: Request, res: Response): Promise<PublicUser> {
    const ctx = this.context(req);
    const access = readAccessToken(req, ctx.panel);
    if (access) {
      const authUser = await this.userFromAccess(access, ctx.panel);
      if (authUser) {
        try {
          this.assertPanelAccess(authUser, ctx.panel);
        } catch {
          this.clearAuthCookies(res, ctx.panel);
          throw new UnauthorizedException('Потрібна авторизація');
        }
        await this.sessions.touch(authUser.sessionId);
        return authUser;
      }
    }
    return this.refresh(req, res).then((data) => data.user);
  }

  async logout(req: Request, res: Response, authUser?: AuthUser) {
    const ctx = this.context(req);
    let sessionId = authUser?.sessionId ?? (await this.sessionIdFromRequest(req, ctx.panel));
    if (!sessionId) {
      const refreshToken = readRefreshToken(req, ctx.panel);
      if (refreshToken) {
        sessionId = (await this.sessions.findByRefreshToken(refreshToken))?.id;
      }
    }
    if (sessionId) {
      await this.sessions.revokeSession(sessionId, 'logout');
    }
    this.clearAuthCookies(res, ctx.panel);
    await this.events.record({
      userId: authUser?.id ?? null,
      sessionId,
      type: 'LOGOUT',
      panel: ctx.panel,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { ok: true };
  }

  async logoutOthers(authUser: AuthUser, req: Request) {
    const ctx = this.context(req);
    await this.sessions.revokeUser(authUser.id, 'logout_others', authUser.sessionId);
    await this.events.record({
      userId: authUser.id,
      sessionId: authUser.sessionId,
      type: 'LOGOUT_ALL',
      panel: ctx.panel,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      meta: { scope: 'others' },
    });
    return { ok: true };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto, req: Request, sessionId?: number) {
    const existing = await this.users.findById(userId);
    if (!existing) {
      throw new UnauthorizedException('Користувача не знайдено');
    }
    const currentBirthDate = existing.birthDate ? existing.birthDate.toISOString().slice(0, 10) : null;
    if (currentBirthDate && dto.birthDate !== undefined && dto.birthDate !== currentBirthDate) {
      throw new BadRequestException('Дату народження можна вказати лише один раз');
    }

    const user = await this.users.updateProfile(userId, {
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      middleName: dto.middleName?.trim() || null,
      birthDate: currentBirthDate ? existing.birthDate : dto.birthDate ? new Date(dto.birthDate) : null,
      phone: dto.phone?.trim() || null,
    });
    const ctx = this.context(req);
    await this.events.record({
      userId,
      sessionId,
      type: 'PROFILE_UPDATED',
      panel: ctx.panel,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { user: this.users.toPublic(user) };
  }

  async changePassword(authUser: AuthUser, dto: ChangePasswordDto, req: Request) {
    const user = await this.users.findById(authUser.id);
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Поточний пароль неправильний.');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Новий пароль має відрізнятися від поточного.');
    }
    await this.users.setPassword(user.id, dto.newPassword);
    await this.sessions.revokeUser(user.id, 'password_changed', authUser.sessionId);
    const ctx = this.context(req);
    await this.events.record({
      userId: user.id,
      sessionId: authUser.sessionId,
      type: 'PASSWORD_CHANGED',
      panel: ctx.panel,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { ok: true };
  }

  async uploadAvatar(authUser: AuthUser, file: Express.Multer.File | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Оберіть зображення');
    }
    if (!this.avatarMimes.has(file.mimetype)) {
      throw new BadRequestException('Аватар: лише JPG, PNG, WebP або GIF');
    }
    if (file.size > this.avatarMaxBytes) {
      throw new BadRequestException('Аватар перевищує 5 МБ');
    }

    const current = await this.users.findById(authUser.id);
    if (!current) {
      throw new UnauthorizedException('Користувача не знайдено');
    }

    const nextUrl = await this.writeAvatarFile(current.id, file);
    const groupId = await this.ensureAvatarMediaGroup();
    await this.prisma.icon.create({
      data: {
        name: `${current.name} avatar`,
        slug: `avatar-${current.id}-${Date.now()}`,
        type: 'image',
        url: nextUrl,
        alt: `${current.name} avatar`,
        mime: file.mimetype,
        sizeBytes: file.size,
        originalName: file.originalname,
        groupId,
      },
    });
    await this.cleanupAvatarArtifacts(current.avatarUrl, nextUrl);

    const updated = await this.users.updateAvatar(current.id, nextUrl);
    return { user: this.users.toPublic(updated) };
  }

  async removeAvatar(authUser: AuthUser) {
    const current = await this.users.findById(authUser.id);
    if (!current) {
      throw new UnauthorizedException('Користувача не знайдено');
    }
    await this.users.updateAvatar(current.id, null);
    await this.cleanupAvatarArtifacts(current.avatarUrl, null);
    const refreshed = await this.users.findById(current.id);
    return { user: this.users.toPublic(refreshed ?? current) };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user || user.status === 'blocked') {
      return { ok: true };
    }
    await this.issuePasswordReset(user);
    return { ok: true };
  }

  async requestOwnPasswordReset(authUser: AuthUser) {
    const user = await this.users.findById(authUser.id);
    if (!user) {
      throw new UnauthorizedException('Користувача не знайдено');
    }
    if (user.status === 'blocked') {
      throw new ForbiddenException('Акаунт заблоковано');
    }
    const result = await this.issuePasswordReset(user);
    if (result.status !== 'sent') {
      throw new BadRequestException(result.errorParsed || 'Не вдалося надіслати лист для зміни пароля.');
    }
    return { ok: true, email: user.email };
  }

  private async issuePasswordReset(user: {
    id: number;
    email: string;
    name: string;
    firstName: string | null;
  }) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }],
      },
    });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return this.mailingsMailer.sendPasswordReset({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      resetLink: this.resetLink(token),
    });
  }

  async resetPassword(dto: ResetPasswordDto, req: Request) {
    const tokenHash = this.hashResetToken(dto.token);
    const item = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!item || item.usedAt || item.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Недійсне або прострочене посилання');
    }
    if (item.user.status === 'blocked') {
      throw new ForbiddenException('Акаунт заблоковано');
    }

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: item.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: item.userId },
        data: { passwordHash: await bcrypt.hash(dto.newPassword, 12), pendingPassword: null },
      }),
    ]);
    await this.sessions.revokeUser(item.userId, 'password_reset');
    const ctx = this.context(req);
    await this.events.record({
      userId: item.userId,
      type: 'PASSWORD_RESET',
      panel: ctx.panel,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { ok: true };
  }

  async userFromAccess(token: string, panel: 'user' | 'admin'): Promise<AuthUser | null> {
    try {
      const payload = this.jwt.verify<AccessPayload>(token);
      if (payload.typ !== 'access' || !payload.userId || !payload.sid) {
        return null;
      }
      const session = await this.sessions.assertActive(payload.sid);
      if (!session || session.userId !== payload.userId || session.panel !== panel) {
        return null;
      }
      const user = await this.users.findById(payload.userId);
      if (!user || user.status === 'blocked') {
        return null;
      }
      return { ...this.users.toPublic(user), sessionId: session.id };
    } catch {
      return null;
    }
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string, panel: 'user' | 'admin') {
    const base = this.cookieBase();
    res.cookie(accessCookieName(panel), accessToken, { ...base, maxAge: this.accessTtlMs });
    res.cookie(refreshCookieName(panel), refreshToken, { ...base, maxAge: this.refreshTtlMs });
    res.clearCookie(LEGACY_ACCESS_COOKIE, base);
    res.clearCookie(LEGACY_REFRESH_COOKIE, base);
  }

  clearAuthCookies(res: Response, panel: 'user' | 'admin') {
    const base = this.cookieBase();
    res.clearCookie(accessCookieName(panel), base);
    res.clearCookie(refreshCookieName(panel), base);
    res.clearCookie(LEGACY_ACCESS_COOKIE, base);
    res.clearCookie(LEGACY_REFRESH_COOKIE, base);
  }

  private async sessionIdFromRequest(req: Request, panel: 'user' | 'admin'): Promise<number | undefined> {
    const access = readAccessToken(req, panel);
    if (!access) {
      return undefined;
    }
    const user = await this.userFromAccess(access, panel);
    return user?.sessionId;
  }

  private signAccess(userId: number, sessionId: number) {
    return this.jwt.sign(
      { userId, sid: sessionId, typ: 'access' } satisfies AccessPayload,
      { expiresIn: this.accessExpiresIn as never },
    );
  }

  private assertPanelAccess(
    user: {
      userRole: UserPanelRole | null;
      isSuperAdmin: boolean;
      adminRoleId?: number | null;
      adminRole?: unknown | null;
    },
    panel: 'user' | 'admin',
  ) {
    if (panel === 'admin') {
      if (!hasAdminPanelAccess(user)) {
        throw new ForbiddenException('Немає доступу до адмін-панелі');
      }
      if (!user.isSuperAdmin && !user.adminRoleId) {
        throw new ForbiddenException('Адміністратору не призначено роль доступу');
      }
      return;
    }
    if (panel === 'user' && !hasUserPanelAccess(user)) {
      throw new ForbiddenException('Немає доступу до кабінету');
    }
  }

  private cookieBase() {
    return {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax' as const,
      path: '/api',
    };
  }

  private context(req: Request) {
    return {
      panel: getRequestPanel(req),
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
    };
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private resetLink(token: string) {
    const baseRaw = this.config.get<string>('RESET_PASSWORD_URL_BASE')
      ?? (process.env.NODE_ENV === 'production' ? this.config.get<string>('USER_PANEL_ORIGIN') : undefined)
      ?? 'http://localhost:3000';
    const base = baseRaw.trim().replace(/\/+$/, '');
    return `${base}/reset-password?token=${encodeURIComponent(token)}`;
  }

  private async ensureAvatarMediaGroup() {
    const existing = await this.prisma.iconGroup.findUnique({
      where: { type_slug: { type: 'image', slug: 'avatars' } },
    });
    if (existing) {
      return existing.id;
    }
    const last = await this.prisma.iconGroup.findFirst({
      where: { type: 'image' },
      orderBy: { sortOrder: 'desc' },
    });
    const created = await this.prisma.iconGroup.create({
      data: {
        type: 'image',
        slug: 'avatars',
        title: 'Аватарки',
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
    return created.id;
  }

  private async writeAvatarFile(userId: number, file: Express.Multer.File) {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const folder = join('avatars', year, month);
    const hash = createHash('sha1').update(randomBytes(8)).digest('hex').slice(0, 12);
    const ext = this.avatarExt(file.originalname, file.mimetype);
    const filename = `user-${userId}-${Date.now()}-${hash}${ext}`;
    const relative = join(folder, filename);
    const absolute = join(process.cwd(), 'uploads', relative);
    await fs.mkdir(dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, file.buffer);
    return `/uploads/${relative.replace(/\\/g, '/')}`;
  }

  private async cleanupAvatarArtifacts(previousUrl: string | null, nextUrl: string | null) {
    if (!previousUrl || previousUrl === nextUrl) {
      return;
    }
    await this.prisma.icon.deleteMany({ where: { type: 'image', url: previousUrl } });
    if (previousUrl.startsWith('/uploads/')) {
      const absolute = join(process.cwd(), previousUrl.replace(/^\//, ''));
      try {
        await fs.unlink(absolute);
      } catch {
        // no-op
      }
    }
  }

  private avatarExt(originalName: string, mime: string) {
    const fromName = extname(originalName).toLowerCase();
    if (fromName && fromName.length <= 8) {
      return fromName;
    }
    if (mime === 'image/jpeg') return '.jpg';
    if (mime === 'image/png') return '.png';
    if (mime === 'image/webp') return '.webp';
    if (mime === 'image/gif') return '.gif';
    return '.jpg';
  }
}
