import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { AdminIconsController } from './admin-icons.controller';
import { IconsService } from './icons.service';

@Module({
  imports: [SettingsModule],
  controllers: [AdminIconsController],
  providers: [IconsService],
  exports: [IconsService],
})
export class IconsModule {}
