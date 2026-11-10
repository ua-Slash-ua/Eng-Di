import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsString()
  @MinLength(2)
  @MaxLength(400)
  quote!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  author!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  result!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
