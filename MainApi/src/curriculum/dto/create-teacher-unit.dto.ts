import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export enum TeacherUnitModeDto {
  readonly = 'readonly',
  fork = 'fork',
}

export class CreateTeacherUnitDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sourceUnitId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title: string;

  @IsEnum(TeacherUnitModeDto)
  mode: TeacherUnitModeDto;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  lessonIds?: number[];
}
