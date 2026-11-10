import { Module, forwardRef } from '@nestjs/common';
import { BlocksModule } from '../blocks/blocks.module';
import { AboutStatsService } from './about-stats.service';
import { AdminAboutStatsController } from './admin-about-stats.controller';

@Module({
  imports: [forwardRef(() => BlocksModule)],
  controllers: [AdminAboutStatsController],
  providers: [AboutStatsService],
  exports: [AboutStatsService],
})
export class AboutStatsModule {}
