import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailingsModule } from '../mailings/mailings.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminStatsService } from './admin-stats.service';

@Module({
  imports: [UsersModule, AuthModule, TariffsModule, MailingsModule],
  controllers: [AdminController],
  providers: [AdminStatsService],
  exports: [AdminStatsService],
})
export class AdminModule {}
