import { Module } from '@nestjs/common';
import { AdminSettingsController } from './admin-settings.controller';
import { PublicSettingsController } from './public-settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [AdminSettingsController, PublicSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
