import { Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AdminPanelGuard } from '../auth/admin-panel.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { LessonsService } from './lessons.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminLessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get('users/:id/lessons')
  @Permissions('users.read')
  list(@Param('id', ParseIntPipe) id: number) {
    return this.lessons.listForStudent(id);
  }

  @Post('users/:id/lessons/:lessonId/refund')
  @Permissions('users.write')
  refund(@Param('id', ParseIntPipe) id: number, @Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.lessons.refundByAdmin(id, lessonId);
  }

  @Post('users/:id/lessons/:lessonId/complete')
  @Permissions('users.write')
  complete(@Param('id', ParseIntPipe) id: number, @Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.lessons.completeByAdmin(id, lessonId);
  }

  @Post('users/:id/lessons/:lessonId/skip')
  @Permissions('users.write')
  skip(@Param('id', ParseIntPipe) id: number, @Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.lessons.skipByAdmin(id, lessonId);
  }
}
