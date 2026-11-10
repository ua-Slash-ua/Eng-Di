import { IsInt, IsOptional, Min } from 'class-validator';

export class AssignContentDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  contentLessonId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  teacherLessonId?: number | null;
}
