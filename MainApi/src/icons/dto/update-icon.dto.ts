import { IsInt, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateIconDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  svg?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string | null;

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
