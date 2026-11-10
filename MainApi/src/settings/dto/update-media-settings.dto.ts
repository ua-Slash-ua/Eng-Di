import { IsArray, IsInt, IsString, ArrayMinSize, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMediaSettingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  imageFormats!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  videoFormats!: string[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  maxImageMb!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2048)
  maxVideoMb!: number;
}
