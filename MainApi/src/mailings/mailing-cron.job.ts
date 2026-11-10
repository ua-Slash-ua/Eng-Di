import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailingTasksService } from './mailing-tasks.service';

@Injectable()
export class MailingCronJob implements OnModuleInit {
  private readonly logger = new Logger(MailingCronJob.name);
  private running = false;

  constructor(private readonly tasks: MailingTasksService) {}

  onModuleInit() {
    setTimeout(() => {
      void this.tick();
    }, 12000);
  }

  @Cron('* * * * *')
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.tasks.tick();
      if (result.enqueued || result.claimed || result.cancelled || result.failed || result.overdue) {
        this.logger.log(
          `Cron: scanned ${result.scanned}, enqueued ${result.enqueued}, sent ${result.sent}, skipped ${result.skipped}, failed ${result.failed}, overdue ${result.overdue}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(`Mailing worker failed: ${message}`);
    } finally {
      this.running = false;
    }
  }
}
