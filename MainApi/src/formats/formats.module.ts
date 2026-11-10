import { Module } from '@nestjs/common';
import { AdminFormatsController } from './admin-formats.controller';
import { FormatsService } from './formats.service';

@Module({
  controllers: [AdminFormatsController],
  providers: [FormatsService],
  exports: [FormatsService],
})
export class FormatsModule {}
