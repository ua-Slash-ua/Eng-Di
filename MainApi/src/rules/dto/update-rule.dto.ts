import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(320)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  accent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
