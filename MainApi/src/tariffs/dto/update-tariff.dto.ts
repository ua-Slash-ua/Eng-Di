import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsPositive, IsString, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

export class UpdateTariffDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  lessons?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  price?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null || Number(value) <= 0 ? null : Number(value)))
  @ValidateIf((_, value) => value != null)
  @IsInt()
  @IsPositive()
  oldPrice?: number | null;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  popular?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  note?: string;

  @IsOptional()
  @IsIn(['start', 'mid', 'pro'])
  variant?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  lessonPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  installmentCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  durationMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  frozenLessonsPerMonth?: number;
}
