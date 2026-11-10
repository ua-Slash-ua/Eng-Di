import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateContentCourseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  levelId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
