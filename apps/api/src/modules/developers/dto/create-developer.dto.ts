import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDeveloperDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  slackId?: string;
}
