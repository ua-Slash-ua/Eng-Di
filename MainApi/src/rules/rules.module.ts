import { Module } from '@nestjs/common';
import { AdminRulesController } from './admin-rules.controller';
import { RulesService } from './rules.service';

@Module({
  controllers: [AdminRulesController],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}
