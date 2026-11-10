import { Module } from '@nestjs/common';
import { AboutStatsModule } from '../about-stats/about-stats.module';
import { BlocksModule } from '../blocks/blocks.module';
import { FaqsModule } from '../faqs/faqs.module';
import { FormatsModule } from '../formats/formats.module';
import { LeadsModule } from '../leads/leads.module';
import { PagesModule } from '../pages/pages.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { RulesModule } from '../rules/rules.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { PublicContentController } from './public-content.controller';

/** Thin public API facade — feature logic lives in dedicated modules. */
@Module({
  imports: [
    PagesModule,
    LeadsModule,
    AboutStatsModule,
    FormatsModule,
    TariffsModule,
    RulesModule,
    FaqsModule,
    ReviewsModule,
    BlocksModule,
  ],
  controllers: [PublicContentController],
})
export class ContentModule {}
