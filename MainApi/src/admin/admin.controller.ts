import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminPanelGuard } from '../auth/admin-panel.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SuperAdminOnly } from '../auth/roles.decorator';
import { AuthEventsService } from '../auth/auth-events.service';
import { getRequestIp, getRequestPanel, getUserAgent } from '../auth/request-context';
import { UsersService } from '../users/users.service';
import type { AuthUser } from '../users/user.types';
import { hasAdminPanelAccess } from '../users/user.types';
import { AdminStatsService } from './admin-stats.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserTariffsService } from '../tariffs/user-tariffs.service';
import { SetTariffPaymentsDto } from '../tariffs/dto/set-tariff-payments.dto';
import { MailingsMailerService } from '../mailings/mailings.mailer';
import { TeacherStudentsService } from '../users/teacher-students.service';
import { AddStudentDto } from './dto/add-student.dto';
import { SetTeacherDto } from './dto/set-teacher.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly stats: AdminStatsService,
    private readonly users: UsersService,
    private readonly events: AuthEventsService,
    private readonly userTariffs: UserTariffsService,
    private readonly classLinks: TeacherStudentsService,
    private readonly mailingsMailer: MailingsMailerService,
  ) {}

  @Get('stats')
  @Permissions('dashboard.read')
  statsSummary() {
    return this.stats.getStats();
  }

  @Get('users')
  @Permissions('users.read')
  listUsers(
    @Query('q') q?: string,
    @Query('userRole') userRole?: string,
    @Query('adminAccess') adminAccess?: string,
    @Query('status') status?: string,
    @Query('user') user?: string,
    @Query('phone') phone?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.users.list({
      q,
      userRole,
      adminAccess,
      status,
      user,
      phone,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }

  @Get('users/directory')
  @Permissions('users.read')
  usersDirectory(@Query('userRole') userRole?: string) {
    return this.classLinks.directory(userRole);
  }

  @Get('users/:id/class')
  @Permissions('users.read')
  userClass(@Param('id', ParseIntPipe) id: number) {
    return this.classLinks.getClass(id);
  }

  @Patch('users/:id/teacher')
  @Permissions('users.write')
  setUserTeacher(@Param('id', ParseIntPipe) id: number, @Body() dto: SetTeacherDto) {
    return this.classLinks.setTeacher(id, dto.teacherId);
  }

  @Post('users/:id/students')
  @Permissions('users.write')
  addUserStudent(@Param('id', ParseIntPipe) id: number, @Body() dto: AddStudentDto) {
    return this.classLinks.addStudent(id, dto.studentId);
  }

  @Delete('users/:id/students/:studentId')
  @Permissions('users.write')
  removeUserStudent(
    @Param('id', ParseIntPipe) id: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.classLinks.removeStudent(id, studentId);
  }

  @Get('users/:id')
  @Permissions('users.read')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    return { user: this.users.toAdminPublic(user) };
  }

  @Get('users/:id/tariffs')
  @Permissions('users.read')
  userTariffsHistory(@Param('id', ParseIntPipe) id: number) {
    return this.userTariffs.listForUser(id);
  }

  @Patch('users/:id/tariffs/:subId/payments')
  @Permissions('users.write')
  setUserTariffPayments(
    @Param('id', ParseIntPipe) id: number,
    @Param('subId', ParseIntPipe) subId: number,
    @Body() dto: SetTariffPaymentsDto,
  ) {
    return this.userTariffs.setPaidCount(id, subId, dto.paidCount);
  }

  @Patch('users/:id')
  @Permissions('users.write')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    const existing = await this.users.findById(id);
    if (!existing) {
      throw new NotFoundException('Користувача не знайдено');
    }

    if (dto.isSuperAdmin && !req.user.isSuperAdmin) {
      throw new ForbiddenException('Лише супер-адмін може призначати супер-адміна');
    }

    const nextIsSuperAdmin = dto.isSuperAdmin ?? existing.isSuperAdmin;
    const nextAdminRoleId = nextIsSuperAdmin
      ? null
      : dto.adminRoleId !== undefined
        ? dto.adminRoleId
        : existing.adminRoleId;

    if (req.user.id === id && hasAdminPanelAccess(existing) && !nextIsSuperAdmin && !nextAdminRoleId) {
      throw new BadRequestException('Не можна зняти собі доступ до адмін-панелі');
    }

    if (existing.isSuperAdmin && dto.isSuperAdmin === false && dto.adminRoleId === undefined) {
      throw new BadRequestException('При знятті супер-адміна оберіть роль доступу');
    }

    const enablingLimitedAdmin =
      !nextIsSuperAdmin &&
      !existing.adminRoleId &&
      dto.adminRoleId !== undefined &&
      dto.adminRoleId !== null;
    if (enablingLimitedAdmin && !dto.adminRoleId) {
      throw new BadRequestException('Оберіть роль доступу для адміністратора');
    }

    const user = await this.users.adminUpdate(id, {
      email: dto.email,
      name: dto.name,
      firstName: dto.firstName,
      lastName: dto.lastName,
      middleName: dto.middleName,
      birthDate: dto.birthDate === null ? null : dto.birthDate ? new Date(dto.birthDate) : undefined,
      phone: dto.phone,
      userRole: dto.userRole,
      isSuperAdmin: dto.isSuperAdmin,
      adminRoleId: dto.adminRoleId,
    });
    return { user: this.users.toAdminPublic(user) };
  }

  @Post('users')
  @Permissions('users.write')
  async createUser(@Body() dto: CreateUserDto, @Req() req: Request & { user: AuthUser }) {
    if (dto.isSuperAdmin && !req.user.isSuperAdmin) {
      throw new ForbiddenException('Лише супер-адмін може створювати супер-адміна');
    }

    if (!dto.userRole && !dto.isSuperAdmin && !dto.adminRoleId) {
      throw new BadRequestException('Оберіть доступ до кабінету або адмін-панелі');
    }

    await this.users.purgeExpiredPendingUsers();

    const email = dto.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    const { user, temporaryPassword } = await this.users.createWithTemporaryPassword({
      email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      middleName: dto.middleName,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      name: dto.name,
      userRole: dto.userRole || null,
      isSuperAdmin: dto.isSuperAdmin ?? false,
      adminRoleId: dto.isSuperAdmin ? null : (dto.adminRoleId ?? null),
    });

    await this.events.record({
      userId: user.id,
      sessionId: req.user.sessionId,
      type: 'ACCOUNT_CREATED',
      panel: getRequestPanel(req),
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
      meta: { actorId: req.user.id, userRole: user.userRole, isSuperAdmin: user.isSuperAdmin },
    });
    const mailing = await this.mailingsMailer.sendWelcome({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      password: temporaryPassword,
    });

    return {
      user: this.users.toAdminPublic(user),
      temporaryPassword,
      mailing,
    };
  }

  @Delete('users/:id')
  @UseGuards(RolesGuard)
  @SuperAdminOnly()
  @Permissions('users.write')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { user: AuthUser }) {
    if (req.user.id === id) {
      throw new BadRequestException('Не можна видалити свій акаунт');
    }
    return this.users.deleteById(id);
  }
}
