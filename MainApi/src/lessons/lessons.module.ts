import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { MailingsModule } from '../mailings/mailings.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { TestsModule } from '../tests/tests.module';
import { CabinetLessonsController } from './cabinet-lessons.controller';
import { AdminLessonsController } from './admin-lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
  imports: [AuthModule, ScheduleModule, MailingsModule, CurriculumModule, TestsModule],
  controllers: [CabinetLessonsController, AdminLessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
