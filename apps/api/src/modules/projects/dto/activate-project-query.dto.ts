import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ActivateProjectQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? value === 'true' || value === '1' : undefined))
  @IsBoolean()
  cascade?: boolean;
}
