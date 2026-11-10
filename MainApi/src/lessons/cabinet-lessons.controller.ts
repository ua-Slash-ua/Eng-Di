import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserPanelGuard } from '../auth/user-panel.guard';
import type { AuthUser } from '../users/user.types';
import { ProposeLessonDto } from './dto/propose-lesson.dto';
import { AssignContentDto } from './dto/assign-content.dto';
import { LessonsService } from './lessons.service';

@Controller('cabinet/lessons')
@UseGuards(JwtAuthGuard, UserPanelGuard)
export class CabinetLessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get()
  board(@Req() req: Request & { user: AuthUser }) {
    return this.lessons.board(req.user.id, req.user.userRole);
  }

  @Get('students/:studentId')
  teacherGroup(@Req() req: Request & { user: AuthUser }, @Param('studentId', ParseIntPipe) studentId: number) {
    return this.lessons.teacherGroup(req.user.id, req.user.userRole, studentId);
  }

  @Get(':id')
  show(@Req() req: Request & { user: AuthUser }, @Param('id', ParseIntPipe) id: number) {
    return this.lessons.show(req.user.id, req.user.userRole, id);
  }

  @Get(':id/slots')
  slots(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
  ) {
    return this.lessons.slots(req.user.id, req.user.userRole, id, from);
  }

  @Post(':id/propose')
  propose(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProposeLessonDto,
  ) {
    return this.lessons.propose(req.user.id, req.user.userRole, id, dto);
  }

  @Post(':id/accept')
  accept(@Req() req: Request & { user: AuthUser }, @Param('id', ParseIntPipe) id: number) {
    return this.lessons.accept(req.user.id, req.user.userRole, id);
  }

  @Post(':id/decline')
  decline(@Req() req: Request & { user: AuthUser }, @Param('id', ParseIntPipe) id: number) {
    return this.lessons.decline(req.user.id, req.user.userRole, id);
  }

  @Post(':id/freeze')
  freeze(@Req() req: Request & { user: AuthUser }, @Param('id', ParseIntPipe) id: number) {
    return this.lessons.freeze(req.user.id, req.user.userRole, id);
  }

  @Post(':id/complete')
  complete(@Req() req: Request & { user: AuthUser }, @Param('id', ParseIntPipe) id: number) {
    return this.lessons.complete(req.user.id, req.user.userRole, id);
  }

  @Post(':id/miss')
  miss(@Req() req: Request & { user: AuthUser }, @Param('id', ParseIntPipe) id: number) {
    return this.lessons.miss(req.user.id, req.user.userRole, id);
  }

  @Patch(':id/content')
  assignContent(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignContentDto,
  ) {
    return this.lessons.assignContent(req.user.id, req.user.userRole, id, dto);
  }
}
