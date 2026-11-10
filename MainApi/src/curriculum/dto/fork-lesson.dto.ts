import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ForkLessonDto {
  @IsInt()
  @Min(1)
  sourceLessonId: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(220)
  title?: string;
}
