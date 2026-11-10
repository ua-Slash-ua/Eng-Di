import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { CabinetClassController } from './cabinet-class.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [AuthModule, UsersModule, TariffsModule],
  controllers: [CabinetClassController],
})
export class ClassModule {}
