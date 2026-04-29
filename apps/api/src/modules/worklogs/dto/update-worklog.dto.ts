import { IsDateString, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateWorklogDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @Min(0.01)
  @Max(24)
  @IsOptional()
  hours?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  componentId?: number;
}
