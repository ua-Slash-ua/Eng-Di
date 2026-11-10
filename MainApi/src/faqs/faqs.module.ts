import { Module } from '@nestjs/common';
import { AdminFaqsController } from './admin-faqs.controller';
import { FaqsService } from './faqs.service';

@Module({
  controllers: [AdminFaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
