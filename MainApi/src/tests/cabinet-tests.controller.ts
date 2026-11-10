import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserPanelGuard } from '../auth/user-panel.guard';
import type { AuthUser } from '../users/user.types';
import { SetTestAttemptQuotaDto, SubmitAttemptDto, UnlockTestDto } from './dto/test.dto';
import { TestsService } from './tests.service';

function requirePanelUser(req: Request): AuthUser {
  const user = (req as Request & { user: AuthUser }).user;
  if (user.userRole !== 'student' && user.userRole !== 'teacher') {
    throw new ForbiddenException('Тест доступний лише учням і вчителям');
  }
  return user;
}

function requireTeacher(req: Request): AuthUser {
  const user = requirePanelUser(req);
  if (user.userRole !== 'teacher') {
    throw new ForbiddenException('Тільки для вчителів');
  }
  return user;
}

@Controller('cabinet/tests')
@UseGuards(JwtAuthGuard, UserPanelGuard)
export class CabinetTestsController {
  constructor(private readonly tests: TestsService) {}

  @Get('me/attempts')
  myAttempts(@Req() req: Request, @Query('testId') testId?: string) {
    const user = requirePanelUser(req);
    return this.tests.listMyAttempts(user.id, testId ? Number(testId) : undefined);
  }

  @Get('granted')
  granted(@Req() req: Request) {
    const user = requirePanelUser(req);
    return this.tests.listGrantedFreeTests(user.id);
  }

  @Get(':id/quotas')
  quotas(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const teacher = requireTeacher(req);
    return this.tests.listAttemptQuotas(id, { teacherId: teacher.id });
  }

  @Patch(':id/quotas')
  setQuota(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetTestAttemptQuotaDto,
  ) {
    const teacher = requireTeacher(req);
    return this.tests.setAttemptQuota(id, teacher.id, dto.userId, dto.extraAttempts, {
      teacherId: teacher.id,
    });
  }

  @Get(':id')
  meta(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = requirePanelUser(req);
    return this.tests.getPublicMeta(id, user.id);
  }

  @Post(':id/unlock')
  unlock(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: UnlockTestDto) {
    const user = requirePanelUser(req);
    return this.tests.unlock(id, user.id, dto.password);
  }

  @Post(':id/attempts')
  start(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = requirePanelUser(req);
    return this.tests.startAttempt(id, user.id);
  }

  @Post('attempts/:attemptId/submit')
  submit(
    @Req() req: Request,
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Body() dto: SubmitAttemptDto,
  ) {
    const user = requirePanelUser(req);
    return this.tests.submitAttempt(attemptId, user.id, dto);
  }
}
