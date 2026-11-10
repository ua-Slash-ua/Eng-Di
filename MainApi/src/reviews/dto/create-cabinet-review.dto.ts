import { IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export const REVIEW_TARGETS = ['school', 'teacher'] as const;
export type ReviewTargetDto = (typeof REVIEW_TARGETS)[number];

export class CreateCabinetReviewDto {
  @IsIn(REVIEW_TARGETS)
  target!: ReviewTargetDto;

  @ValidateIf((dto: CreateCabinetReviewDto) => dto.target === 'teacher')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherId?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(400)
  quote!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  result!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}
