import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, Max, Min, ValidateNested } from 'class-validator';

export class WorkDayDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  weekday!: number;

  @IsBoolean()
  off!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1440)
  startMinute!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1440)
  endMinute!: number;
}

export class SaveWorkDto {
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => WorkDayDto)
  days!: WorkDayDto[];
}
