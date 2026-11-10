import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { AdminMailingsController } from './admin-mailings.controller';
import { BounceMailJob } from './bounce-mail.job';
import { MailingCronJob } from './mailing-cron.job';
import { MailingTasksService } from './mailing-tasks.service';
import { MailingsMailerService } from './mailings.mailer';
import { MailingsService } from './mailings.service';

@Module({
  imports: [SettingsModule],
  controllers: [AdminMailingsController],
  providers: [MailingsService, MailingsMailerService, MailingTasksService, MailingCronJob, BounceMailJob],
  exports: [MailingsService, MailingsMailerService, MailingTasksService],
})
export class MailingsModule {}
