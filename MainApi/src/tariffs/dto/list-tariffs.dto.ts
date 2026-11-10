import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ListTariffsDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  /** Comma separated variant keys. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  variant?: string;
}
