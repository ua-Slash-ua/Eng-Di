import { IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { TeacherUnitModeDto } from './create-teacher-unit.dto';

export class UpdateTeacherUnitDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsEnum(TeacherUnitModeDto)
  mode?: TeacherUnitModeDto;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  lessonIds?: number[];
}
