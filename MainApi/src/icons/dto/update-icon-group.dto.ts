import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateIconGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @IsIn(['svg', 'image', 'video'])
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
