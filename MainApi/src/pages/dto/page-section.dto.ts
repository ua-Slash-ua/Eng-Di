import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class AttachPageSectionDto {
  @Type(() => Number)
  @IsInt()
  blockId!: number;
}

export class ReorderPageSectionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  sectionIds!: number[];
}
