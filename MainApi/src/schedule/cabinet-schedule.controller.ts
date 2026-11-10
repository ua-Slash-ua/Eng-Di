import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserPanelGuard } from '../auth/user-panel.guard';
import type { AuthUser } from '../users/user.types';
import { CreateBusyDto } from './dto/create-busy.dto';
import { SaveWorkDto } from './dto/save-work.dto';
import { ScheduleService } from './schedule.service';

@Controller('cabinet/schedule')
@UseGuards(JwtAuthGuard, UserPanelGuard)
export class CabinetScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get()
  overview(@Req() req: Request & { user: AuthUser }, @Query('from') from?: string) {
    return this.schedule.overview(req.user.id, from);
  }

  @Put('work')
  saveWork(@Req() req: Request & { user: AuthUser }, @Body() dto: SaveWorkDto, @Query('from') from?: string) {
    return this.schedule.saveWork(req.user.id, dto, from);
  }

  @Post('busy')
  addBusy(@Req() req: Request & { user: AuthUser }, @Body() dto: CreateBusyDto, @Query('from') from?: string) {
    return this.schedule.addBusy(req.user.id, dto, from);
  }

  @Delete(':id')
  remove(@Req() req: Request & { user: AuthUser }, @Param('id', ParseIntPipe) id: number, @Query('from') from?: string) {
    return this.schedule.removeRule(req.user.id, id, from);
  }
}
