import { IsDateString } from 'class-validator';

export class GetDailyQueryDto {
  @IsDateString({}, { message: 'date must be a valid ISO date string (YYYY-MM-DD)' })
  date!: string;
}
