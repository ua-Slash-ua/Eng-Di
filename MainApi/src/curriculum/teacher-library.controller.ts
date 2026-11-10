import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ContentEntityType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserPanelGuard } from '../auth/user-panel.guard';
import type { AuthUser } from '../users/user.types';
import { TeacherLibraryService } from './teacher-library.service';
import { ForkLessonDto } from './dto/fork-lesson.dto';
import { UpdateTeacherLessonDto } from './dto/update-teacher-lesson.dto';
import { CreateTeacherUnitDto } from './dto/create-teacher-unit.dto';
import { UpdateTeacherUnitDto } from './dto/update-teacher-unit.dto';

function requireLibraryUser(req: Request): AuthUser {
  const user = (req as Request & { user: AuthUser }).user;
  if (user.userRole !== 'teacher' && user.userRole !== 'student') {
    throw new ForbiddenException('Бібліотека доступна лише учням і вчителям');
  }
  return user;
}

function requireTeacher(req: Request): AuthUser {
  const user = (req as Request & { user: AuthUser }).user;
  if (user.userRole !== 'teacher') {
    throw new ForbiddenException('Тільки для вчителів');
  }
  return user;
}

@Controller('cabinet/library')
@UseGuards(JwtAuthGuard, UserPanelGuard)
export class TeacherLibraryController {
  constructor(private readonly library: TeacherLibraryService) {}

  @Get()
  getLibrary(@Req() req: Request) {
    const user = requireLibraryUser(req);
    return this.library.getLibrary(user.id, { includeOwn: user.userRole === 'teacher' });
  }

  @Get('content/:type/:id')
  getContentDetail(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = requireLibraryUser(req);
    const entityType = type as ContentEntityType;
    if (!Object.values(ContentEntityType).includes(entityType)) {
      throw new ForbiddenException('Невідомий тип матеріалу');
    }
    return this.library.getContentDetail(user.id, entityType, id, {
      revealPassword: user.userRole === 'teacher',
    });
  }

  // ── Own lessons ────────────────────────────────────────────────────────────

  @Get('lessons')
  getOwnLessons(@Req() req: Request) {
    const user = requireTeacher(req);
    return this.library.getOwnLessons(user.id);
  }

  @Post('lessons/fork')
  forkLesson(@Body() dto: ForkLessonDto, @Req() req: Request) {
    const user = requireTeacher(req);
    return this.library.forkLesson(user.id, dto);
  }

  @Get('lessons/:id')
  getOwnLesson(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = requireTeacher(req);
    return this.library.getOwnLesson(user.id, id);
  }

  @Patch('lessons/:id')
  updateLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherLessonDto,
    @Req() req: Request,
  ) {
    const user = requireTeacher(req);
    return this.library.updateOwnLesson(user.id, id, dto);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = requireTeacher(req);
    return this.library.removeOwnLesson(user.id, id);
  }

  // ── Own units ──────────────────────────────────────────────────────────────

  @Get('units')
  getOwnUnits(@Req() req: Request) {
    const user = requireTeacher(req);
    return this.library.getOwnUnits(user.id);
  }

  @Post('units')
  createUnit(@Body() dto: CreateTeacherUnitDto, @Req() req: Request) {
    const user = requireTeacher(req);
    return this.library.createOwnUnit(user.id, dto);
  }

  @Patch('units/:id')
  updateUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherUnitDto,
    @Req() req: Request,
  ) {
    const user = requireTeacher(req);
    return this.library.updateOwnUnit(user.id, id, dto);
  }

  @Delete('units/:id')
  deleteUnit(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = requireTeacher(req);
    return this.library.removeOwnUnit(user.id, id);
  }
}
