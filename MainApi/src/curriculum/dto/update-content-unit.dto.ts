import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateContentUnitDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  courseId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  /** Replace assigned lessons for this unit. */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  lessonIds?: number[];
}
