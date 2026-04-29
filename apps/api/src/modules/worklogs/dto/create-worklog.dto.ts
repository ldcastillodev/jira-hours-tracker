import { IsDateString, IsInt, IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateWorklogDto {
  @IsDateString()
  date!: string;

  @IsNumber()
  @Min(0.01)
  @Max(24)
  hours!: number;

  @IsString()
  @MinLength(1)
  jiraWorklogId!: string;

  @IsString()
  @MinLength(1)
  ticketKey!: string;

  @IsString()
  @MinLength(1)
  assigned!: string;

  @IsInt()
  @Min(1)
  componentId!: number;
}
