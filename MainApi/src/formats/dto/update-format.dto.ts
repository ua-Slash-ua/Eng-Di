import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateFormatDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(320)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  accent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
