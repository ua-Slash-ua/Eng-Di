import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import { AuthEventsService } from './auth-events.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { PageViewDto } from './dto/page-view.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { getRequestIp, getRequestPanel, getUserAgent } from './request-context';
import type { AuthUser } from '../users/user.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly events: AuthEventsService,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.login(dto, req, res);
  }

  @Post('refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.refresh(req, res);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Req() req: Request, @Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto, req);
  }

  @Get('me')
  me(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.resolveMe(req, res).then((user) => ({ user }));
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('logout')
  logout(
    @Req() req: Request & { user?: AuthUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.logout(req, res, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-others')
  logoutOthers(@Req() req: Request & { user: AuthUser }) {
    return this.auth.logoutOthers(req.user, req);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.auth.updateProfile(req.user.id, dto, req, req.user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(
    @Req() req: Request & { user: AuthUser },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.auth.uploadAvatar(req.user, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/avatar/remove')
  removeAvatar(@Req() req: Request & { user: AuthUser }) {
    return this.auth.removeAvatar(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  changePassword(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(req.user, dto, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('password/forgot')
  requestOwnPasswordReset(@Req() req: Request & { user: AuthUser }) {
    return this.auth.requestOwnPasswordReset(req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('page-view')
  async pageView(@Req() req: Request & { user?: AuthUser }, @Body() dto: PageViewDto) {
    await this.events.recordPageView({
      userId: req.user?.id ?? null,
      sessionId: req.user?.sessionId ?? null,
      panel: getRequestPanel(req),
      path: dto.path,
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
    });
    return { ok: true };
  }
}
