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
import { CreateRuleDto } from './dto/create-rule.dto';
import { ListRulesDto } from './dto/list-rules.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RulesService } from './rules.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminRulesController {
  constructor(private readonly rules: RulesService) {}

  @Get('rules')
  @Permissions('rules.read')
  listRules(@Query() query: ListRulesDto) {
    return this.rules.listAdmin(query);
  }

  @Get('rules/catalog')
  @Permissions('rules.read')
  catalogRules() {
    return this.rules.catalog();
  }

  @Post('rules')
  @Permissions('rules.write')
  createRule(@Body() dto: CreateRuleDto) {
    return this.rules.create(dto);
  }

  @Get('rules/:id')
  @Permissions('rules.read')
  getRule(@Param('id', ParseIntPipe) id: number) {
    return this.rules.findById(id);
  }

  @Patch('rules/:id')
  @Permissions('rules.write')
  updateRule(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRuleDto) {
    return this.rules.update(id, dto);
  }

  @Delete('rules/:id')
  @Permissions('rules.delete')
  deleteRule(@Param('id', ParseIntPipe) id: number) {
    return this.rules.remove(id);
  }
}
