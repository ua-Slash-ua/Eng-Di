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
  Req,
  UseGuards,
} from '@nestjs/common';
import { TestKind } from '@prisma/client';
import type { Request } from 'express';
import { AdminPanelGuard } from '../auth/admin-panel.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreateTestDto, GrantTestAccessDto, SetTestAttemptQuotaDto, UpdateTestDto } from './dto/test.dto';
import { TestsService } from './tests.service';

@Controller('admin/tests')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminTestsController {
  constructor(private readonly tests: TestsService) {}

  @Get()
  @Permissions('tests.read', 'curriculum.read')
  list(@Query('kind') kind?: string) {
    return this.tests.listTests(kind === 'free' || kind === 'material' ? (kind as TestKind) : undefined);
  }

  @Post()
  @Permissions('tests.write')
  create(@Body() dto: CreateTestDto) {
    return this.tests.createTest(dto);
  }

  @Get(':id')
  @Permissions('tests.read', 'curriculum.read')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.tests.findTest(id);
  }

  @Patch(':id')
  @Permissions('tests.write')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTestDto) {
    return this.tests.updateTest(id, dto);
  }

  @Delete(':id')
  @Permissions('tests.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tests.removeTest(id);
  }

  @Get(':id/stats')
  @Permissions('tests.read', 'curriculum.read')
  stats(@Param('id', ParseIntPipe) id: number) {
    return this.tests.getStats(id);
  }

  @Get(':id/attempts')
  @Permissions('tests.read', 'curriculum.read')
  attempts(@Param('id', ParseIntPipe) id: number) {
    return this.tests.listAttempts(id);
  }

  @Get(':id/attempts/:attemptId')
  @Permissions('tests.read', 'curriculum.read')
  attemptDetail(
    @Param('id', ParseIntPipe) id: number,
    @Param('attemptId', ParseIntPipe) attemptId: number,
  ) {
    return this.tests.getAttemptAdmin(id, attemptId);
  }

  @Get(':id/quotas')
  @Permissions('tests.read', 'curriculum.read')
  quotas(@Param('id', ParseIntPipe) id: number) {
    return this.tests.listAttemptQuotas(id);
  }

  @Patch(':id/quotas')
  @Permissions('tests.write')
  setQuota(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetTestAttemptQuotaDto,
    @Req() req: Request & { user: { id: number } },
  ) {
    return this.tests.setAttemptQuota(id, req.user.id, dto.userId, dto.extraAttempts);
  }

  @Get(':id/grants')
  @Permissions('tests.read', 'curriculum.read')
  grants(@Param('id', ParseIntPipe) id: number) {
    return this.tests.listGrants(id);
  }

  @Post(':id/grants')
  @Permissions('tests.write')
  grant(@Param('id', ParseIntPipe) id: number, @Body() dto: GrantTestAccessDto) {
    const userIds = [
      ...(dto.userIds ?? []),
      ...(dto.userId != null ? [dto.userId] : []),
    ];
    return this.tests.adminGrantMany(id, userIds);
  }

  @Delete(':id/grants/:grantId')
  @Permissions('tests.write')
  revokeGrant(
    @Param('id', ParseIntPipe) id: number,
    @Param('grantId', ParseIntPipe) grantId: number,
  ) {
    return this.tests.adminRevokeGrant(id, grantId);
  }
}
