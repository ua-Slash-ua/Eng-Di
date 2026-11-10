import { ArrayMinSize, ArrayUnique, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkDeleteIconsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  ids!: number[];
}
