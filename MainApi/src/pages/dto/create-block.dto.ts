import { BlockType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateBlockDto {
  @IsEnum(BlockType)
  type!: BlockType;
}
