import { IsInt, IsObject, IsOptional, Min } from 'class-validator';

export class UpdateBlockDto {
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
