import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateContentUnitDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  courseId?: number;

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
