import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminPanelGuard } from '../auth/admin-panel.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { MailingsService } from './mailings.service';
import { MailingTasksService } from './mailing-tasks.service';

@Controller('admin/mailings')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminMailingsController {
  constructor(
    private readonly mailings: MailingsService,
    private readonly tasks: MailingTasksService,
  ) {}

  @Get('stats')
  stats() {
    return this.mailings.stats();
  }

  @Get('logs')
  listLogs(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('email') email?: string,
    @Query('user') user?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mailings.list({
      q,
      type,
      email,
      user,
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }

  @Get('tasks')
  listTasks(
    @Query('q') q?: string,
    @Query('kind') kind?: string,
    @Query('status') status?: string,
    @Query('email') email?: string,
    @Query('user') user?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasks.listTasks({
      q,
      kind,
      status,
      email,
      user,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }

  @Get('cron-runs')
  listCronRuns(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasks.listCronRuns({
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }
}
