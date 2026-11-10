import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminTestsController } from './admin-tests.controller';
import { CabinetTestsController } from './cabinet-tests.controller';
import { TestsService } from './tests.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminTestsController, CabinetTestsController],
  providers: [TestsService],
  exports: [TestsService],
})
export class TestsModule {}
