import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { TestsModule } from '../tests/tests.module';
import { AdminCurriculumController } from './admin-curriculum.controller';
import { ContentChainService } from './content-chain.service';
import { CurriculumService } from './curriculum.service';
import { LessonPresentationsService } from './lesson-presentations.service';
import { TeacherLibraryController } from './teacher-library.controller';
import { TeacherLibraryService } from './teacher-library.service';

@Module({
  imports: [PrismaModule, SettingsModule, TestsModule],
  controllers: [AdminCurriculumController, TeacherLibraryController],
  providers: [CurriculumService, TeacherLibraryService, LessonPresentationsService, ContentChainService],
  exports: [CurriculumService, TeacherLibraryService, LessonPresentationsService, ContentChainService],
})
export class CurriculumModule {}