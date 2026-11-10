import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class ProposeLessonDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @Type(() => Number)
  @IsInt()
  @Min(6)
  @Max(21)
  hour!: number;

  /** Optional minutes within the hour (0–59). Default 0. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(59)
  minute?: number;
}
