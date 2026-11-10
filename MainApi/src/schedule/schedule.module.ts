import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CabinetScheduleController } from './cabinet-schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [AuthModule],
  controllers: [CabinetScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
