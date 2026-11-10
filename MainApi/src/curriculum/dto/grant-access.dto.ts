import { Type } from 'class-transformer';
import { IsEnum, IsInt, Min } from 'class-validator';

export enum ContentEntityTypeDto {
  level = 'level',
  course = 'course',
  unit = 'unit',
  lesson = 'lesson',
}

export enum TeacherAccessModeDto {
  readonly = 'readonly',
  fork = 'fork',
}

export class GrantAccessDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherId: number;

  @IsEnum(ContentEntityTypeDto)
  entityType: ContentEntityTypeDto;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  entityId: number;

  @IsEnum(TeacherAccessModeDto)
  mode: TeacherAccessModeDto;
}
