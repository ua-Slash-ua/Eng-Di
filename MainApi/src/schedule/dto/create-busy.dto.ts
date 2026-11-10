import { Type } from 'class-transformer';
import { IsIn, IsInt, IsString, Matches, Max, Min, ValidateIf } from 'class-validator';

export class CreateBusyDto {
  @IsIn(['weekly', 'date', 'daily'])
  scope!: 'weekly' | 'date' | 'daily';

  @ValidateIf((dto: CreateBusyDto) => dto.scope === 'weekly')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  weekday?: number;

  @ValidateIf((dto: CreateBusyDto) => dto.scope === 'date')
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1439)
  startMinute!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  endMinute!: number;
}
