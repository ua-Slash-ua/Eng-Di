import { IsInt, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIconDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2048)
  svg?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  type?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsInt()
  groupId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
