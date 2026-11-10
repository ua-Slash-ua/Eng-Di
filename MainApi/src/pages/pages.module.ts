import { Module, forwardRef } from '@nestjs/common';
import { BlocksModule } from '../blocks/blocks.module';
import { AdminPagesController } from './admin-pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [forwardRef(() => BlocksModule)],
  controllers: [AdminPagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
