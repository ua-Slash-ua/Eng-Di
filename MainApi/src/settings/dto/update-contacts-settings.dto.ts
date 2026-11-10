import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ContactSocialDto {
  @IsString()
  @MaxLength(40)
  label!: string;

  @IsString()
  @MaxLength(300)
  url!: string;
}

export class UpdateContactsSettingsDto {
  @IsString()
  @MaxLength(120)
  email!: string;

  @IsString()
  @MaxLength(40)
  phone!: string;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ContactSocialDto)
  socials!: ContactSocialDto[];
}
