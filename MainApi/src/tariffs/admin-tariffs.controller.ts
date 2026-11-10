import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminPanelGuard } from '../auth/admin-panel.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { ListTariffsDto } from './dto/list-tariffs.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { TariffsService } from './tariffs.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminTariffsController {
  constructor(private readonly tariffs: TariffsService) {}

  @Get('tariffs')
  @Permissions('tariffs.read')
  listTariffs(@Query() query: ListTariffsDto) {
    return this.tariffs.listAdmin(query);
  }

  @Get('tariffs/catalog')
  @Permissions('tariffs.read')
  catalogTariffs() {
    return this.tariffs.catalog();
  }

  @Post('tariffs')
  @Permissions('tariffs.write')
  createTariff(@Body() dto: CreateTariffDto) {
    return this.tariffs.create(dto);
  }

  @Get('tariffs/:id')
  @Permissions('tariffs.read')
  getTariff(@Param('id', ParseIntPipe) id: number) {
    return this.tariffs.findById(id);
  }

  @Patch('tariffs/:id')
  @Permissions('tariffs.write')
  updateTariff(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTariffDto) {
    return this.tariffs.update(id, dto);
  }

  @Delete('tariffs/:id')
  @Permissions('tariffs.delete')
  deleteTariff(@Param('id', ParseIntPipe) id: number) {
    return this.tariffs.remove(id);
  }
}
