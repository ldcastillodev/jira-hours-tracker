import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateComponentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsBoolean()
  isBillable!: boolean;
}
