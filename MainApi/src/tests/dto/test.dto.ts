import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentEntityType, TestAccessDuration, TestAnswerKind, TestKind } from '@prisma/client';

export const DEFAULT_MAX_ATTEMPTS = 3;
export const MAX_EXTRA_ATTEMPTS = 5;
export const MIN_MAX_ATTEMPTS = 1;
export const ABS_MAX_ATTEMPTS = 20;

export class GrantTestAccessDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  userIds?: number[];
}

export class SetTestAttemptQuotaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_EXTRA_ATTEMPTS)
  extraAttempts!: number;
}

export class UpsertTestAnswerOptionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsString()
  @MaxLength(500)
  text!: string;

  @IsEnum(TestAnswerKind)
  kind!: TestAnswerKind;

  @IsBoolean()
  isCorrect!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpsertTestQuestionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsString()
  @MaxLength(1000)
  prompt!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertTestAnswerOptionDto)
  options!: UpsertTestAnswerOptionDto[];
}

export class CreateTestDto {
  @IsString()
  @MaxLength(220)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(TestKind)
  kind!: TestKind;

  @IsOptional()
  @IsEnum(ContentEntityType)
  entityType?: ContentEntityType | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  entityId?: number | null;

  @IsEnum(TestAccessDuration)
  accessDuration!: TestAccessDuration;

  @IsString()
  @MaxLength(64)
  entryPassword!: string;

  @IsOptional()
  @IsBoolean()
  randomize?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_MAX_ATTEMPTS)
  @Max(ABS_MAX_ATTEMPTS)
  maxAttempts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertTestQuestionDto)
  questions?: UpsertTestQuestionDto[];
}

export class UpdateTestDto {
  @IsOptional()
  @IsString()
  @MaxLength(220)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsEnum(TestKind)
  kind?: TestKind;

  @IsOptional()
  @IsEnum(ContentEntityType)
  entityType?: ContentEntityType | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  entityId?: number | null;

  @IsOptional()
  @IsEnum(TestAccessDuration)
  accessDuration?: TestAccessDuration;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  entryPassword?: string;

  @IsOptional()
  @IsBoolean()
  randomize?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_MAX_ATTEMPTS)
  @Max(ABS_MAX_ATTEMPTS)
  maxAttempts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertTestQuestionDto)
  questions?: UpsertTestQuestionDto[];
}

export class UnlockTestDto {
  @IsString()
  @MaxLength(64)
  password!: string;
}

export class SubmitAttemptAnswerDto {
  @IsInt()
  @Min(1)
  questionId!: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  selectedOptionIds?: number[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  writtenText?: string;
}

export class SubmitAttemptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAttemptAnswerDto)
  answers!: SubmitAttemptAnswerDto[];
}
