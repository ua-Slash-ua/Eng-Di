import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AddStudentDto {
  @Type(() => Number)
  @IsInt()
  studentId!: number;
}
