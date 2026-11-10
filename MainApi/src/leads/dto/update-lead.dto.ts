import { LeadStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLeadDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId?: number;
}
