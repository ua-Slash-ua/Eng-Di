import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFaqDto {
  @IsString()
  @MinLength(2)
  @MaxLength(220)
  question!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(600)
  answer!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
