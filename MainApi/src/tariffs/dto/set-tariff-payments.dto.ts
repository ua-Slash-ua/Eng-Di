import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SetTariffPaymentsDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  paidCount!: number;
}
