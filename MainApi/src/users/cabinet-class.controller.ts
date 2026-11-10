import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserPanelGuard } from '../auth/user-panel.guard';
import { UserTariffsService } from '../tariffs/user-tariffs.service';
import type { AuthUser } from './user.types';
import { TeacherStudentsService } from './teacher-students.service';

@Controller('cabinet/class')
@UseGuards(JwtAuthGuard, UserPanelGuard)
export class CabinetClassController {
  constructor(
    private readonly links: TeacherStudentsService,
    private readonly userTariffs: UserTariffsService,
  ) {}

  @Get()
  mine(@Req() req: Request & { user: AuthUser }) {
    return this.links.getClass(req.user.id);
  }

  @Get('students/:id')
  async studentCard(@Req() req: Request & { user: AuthUser }, @Param('id', ParseIntPipe) id: number) {
    const student = await this.links.studentForTeacher(req.user.id, id);
    const academy = await this.userTariffs.academy(id);
    return {
      student,
      tariff: academy.current
        ? {
            title: academy.current.tariff.title,
            startsAt: academy.current.startsAt,
            endsAt: academy.current.endsAt,
            availableLessons: academy.availableLessons,
            totalLessons: academy.totalLessons,
          }
        : null,
    };
  }
}
