import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule as CronScheduleModule } from '@nestjs/schedule';
import { AboutStatsModule } from './about-stats/about-stats.module';
import { AdminModule } from './admin/admin.module';
import { AdminRolesModule } from './admin-roles/admin-roles.module';
import { AuthModule } from './auth/auth.module';
import { BlocksModule } from './blocks/blocks.module';
import { ContentModule } from './content/content.module';
import { FaqsModule } from './faqs/faqs.module';
import { FormatsModule } from './formats/formats.module';
import { HealthController } from './health.controller';
import { IconsModule } from './icons/icons.module';
import { LeadsModule } from './leads/leads.module';
import { MailingsModule } from './mailings/mailings.module';
import { PagesModule } from './pages/pages.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RulesModule } from './rules/rules.module';
import { SettingsModule } from './settings/settings.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { LessonsModule } from './lessons/lessons.module';
import { ClassModule } from './users/class.module';
import { ScheduleModule } from './schedule/schedule.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { TestsModule } from './tests/tests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    CronScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ClassModule,
    ScheduleModule,
    AdminModule,
    AdminRolesModule,
    PagesModule,
    LeadsModule,
    AboutStatsModule,
    FormatsModule,
    TariffsModule,
    LessonsModule,
    RulesModule,
    FaqsModule,
    ReviewsModule,
    BlocksModule,
    IconsModule,
    SettingsModule,
    MailingsModule,
    ContentModule,
    CurriculumModule,
    TestsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
