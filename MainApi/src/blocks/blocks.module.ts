import { Module, forwardRef } from '@nestjs/common';
import { AboutStatsModule } from '../about-stats/about-stats.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { RulesModule } from '../rules/rules.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { AdminBlocksController } from './admin-blocks.controller';
import { BlocksService } from './blocks.service';

@Module({
  imports: [forwardRef(() => AboutStatsModule), TariffsModule, RulesModule, ReviewsModule],
  controllers: [AdminBlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
