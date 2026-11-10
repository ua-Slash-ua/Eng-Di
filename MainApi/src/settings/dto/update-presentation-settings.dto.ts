import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsString, Max, Min } from 'class-validator';

export class UpdatePresentationSettingsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  formats: string[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(512)
  maxMb: number;
}
