import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class SelectTariffDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  confirm?: boolean;
}
