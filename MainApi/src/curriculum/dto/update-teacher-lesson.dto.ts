import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTeacherLessonDto {
  @IsOptional()
  @IsString()
  @MaxLength(220)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  content?: unknown;
}
