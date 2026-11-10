import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateContentLessonDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  unitId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(220)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  content?: unknown;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
