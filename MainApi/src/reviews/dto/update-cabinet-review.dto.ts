import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { REVIEW_TARGETS, type ReviewTargetDto } from './create-cabinet-review.dto';

export class UpdateCabinetReviewDto {
  @IsOptional()
  @IsIn(REVIEW_TARGETS)
  target?: ReviewTargetDto;

  @ValidateIf((dto: UpdateCabinetReviewDto) => dto.target === 'teacher')
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherId?: number | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(400)
  quote?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  result?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
