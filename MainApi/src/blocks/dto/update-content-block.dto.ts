import { IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { BLOCK_TYPES } from '../block-types';

export class UpdateContentBlockDto {
  @IsOptional()
  @IsIn([...BLOCK_TYPES])
  type?: (typeof BLOCK_TYPES)[number];

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  plaque?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, string>;
}
