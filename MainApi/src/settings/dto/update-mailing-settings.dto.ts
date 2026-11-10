import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class MailingTemplateDto {
  @IsString()
  @MaxLength(300)
  subject!: string;

  @IsString()
  @MaxLength(20000)
  body!: string;
}

export class UpdateMailingSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  welcomeRegistration?: boolean;

  @IsOptional()
  @IsBoolean()
  passwordReset?: boolean;

  @IsOptional()
  @IsObject()
  flags?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  templates?: Record<string, MailingTemplateDto>;
}
