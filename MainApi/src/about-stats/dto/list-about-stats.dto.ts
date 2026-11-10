import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ListAboutStatsDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  value?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  icon?: string;
}
