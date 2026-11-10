import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUiSettingsDto {
  @IsOptional()
  @IsBoolean()
  showNewBadges?: boolean;
}
