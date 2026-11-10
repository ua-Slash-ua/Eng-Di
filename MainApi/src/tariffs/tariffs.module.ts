import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminTariffsController } from './admin-tariffs.controller';
import { CabinetTariffsController } from './cabinet-tariffs.controller';
import { TariffsService } from './tariffs.service';
import { UserTariffsService } from './user-tariffs.service';
import { LessonsModule } from '../lessons/lessons.module';
import { MailingsModule } from '../mailings/mailings.module';

@Module({
  imports: [AuthModule, LessonsModule, MailingsModule],
  controllers: [AdminTariffsController, CabinetTariffsController],
  providers: [TariffsService, UserTariffsService],
  exports: [TariffsService, UserTariffsService],
})
export class TariffsModule {}
