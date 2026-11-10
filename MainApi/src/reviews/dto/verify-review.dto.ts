import { IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class VerifyReviewDto {
  @Type(() => Boolean)
  @IsBoolean()
  isVerified!: boolean;
}
