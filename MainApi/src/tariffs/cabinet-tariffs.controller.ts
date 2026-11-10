import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserPanelGuard } from '../auth/user-panel.guard';
import type { AuthUser } from '../users/user.types';
import { SelectTariffDto } from './dto/select-tariff.dto';
import { UserTariffsService } from './user-tariffs.service';

@Controller('cabinet/tariffs')
@UseGuards(JwtAuthGuard, UserPanelGuard)
export class CabinetTariffsController {
  constructor(private readonly userTariffs: UserTariffsService) {}

  @Get()
  overview(@Req() req: Request & { user: AuthUser }) {
    return this.userTariffs.overview(req.user.id);
  }

  @Post('scheduled/cancel')
  cancelScheduled(@Req() req: Request & { user: AuthUser }) {
    return this.userTariffs.cancelScheduled(req.user.id);
  }

  @Post(':id/select')
  select(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SelectTariffDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.userTariffs.select(req.user.id, id, Boolean(dto.confirm));
  }
}
