import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ListBlocksDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  plaque?: string;
}
