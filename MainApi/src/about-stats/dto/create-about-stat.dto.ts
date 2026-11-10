import { IsInt, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAboutStatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  value!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

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
  categoryId?: number;
}
