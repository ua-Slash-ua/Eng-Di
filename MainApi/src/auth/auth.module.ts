import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailingsModule } from '../mailings/mailings.module';
import { SettingsModule } from '../settings/settings.module';
import { UsersModule } from '../users/users.module';
import { AdminAuthController } from './admin-auth.controller';
import { AuthController } from './auth.controller';
import { AuthEventsService } from './auth-events.service';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LoginRateLimit } from './login-rate-limit';
import { AdminPanelGuard } from './admin-panel.guard';
import { PermissionsGuard } from './permissions.guard';
import { RolesGuard } from './roles.guard';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    UsersModule,
    SettingsModule,
    MailingsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, JwtStrategy, SessionsService, AuthEventsService, LoginRateLimit, AdminPanelGuard, PermissionsGuard, RolesGuard],
  exports: [AuthService, SessionsService, AuthEventsService, AdminPanelGuard, PermissionsGuard, RolesGuard],
})
export class AuthModule {}
