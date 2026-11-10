import { Transform } from 'class-transformer';
import { IsInt, ValidateIf } from 'class-validator';

export class SetTeacherDto {
  @Transform(({ value }) => {
    if (value === null || value === '' || value === undefined) return null;
    return Number(value);
  })
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  teacherId!: number | null;
}
