import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { BLOCK_TYPES } from '../block-types';

export class CreateContentBlockDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsIn([...BLOCK_TYPES])
  type!: (typeof BLOCK_TYPES)[number];
}
