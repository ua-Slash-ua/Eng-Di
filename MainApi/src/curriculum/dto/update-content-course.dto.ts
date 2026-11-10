import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateContentCourseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  levelId?: number | null;

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

  /** Replace assigned units for this course. */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  unitIds?: number[];
}
