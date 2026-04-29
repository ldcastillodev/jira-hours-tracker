import { IsArray, IsDateString, IsEmail, IsIn, IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetCustomReportQueryDto {
  @IsIn(['day', 'week', 'month'])
  period!: 'day' | 'week' | 'month';

  @IsDateString({}, { message: 'startDate must be a valid YYYY-MM-DD date' })
  startDate!: string;

  @IsOptional()
  @Transform(({ value }) => (value ? value.split(',').map(Number).filter(Boolean) : undefined))
  @IsArray()
  @IsInt({ each: true })
  projectIds?: number[];

  @IsOptional()
  @Transform(({ value }) =>
    value
      ? value
          .split(',')
          .map((e: string) => e.trim())
          .filter(Boolean)
      : undefined
  )
  @IsArray()
  @IsEmail({}, { each: true })
  developerEmails?: string[];
}
