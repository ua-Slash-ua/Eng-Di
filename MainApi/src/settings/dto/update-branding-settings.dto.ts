import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateBrandingSettingsDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  faviconUrl?: string | null;
}
