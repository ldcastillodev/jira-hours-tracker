import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('client-hours')
  getClientHours(@Query('month') month?: string) {
    return this.reportsService.getClientHours(month);
  }

  @Get('developer-workload')
  getDeveloperWorkload(@Query('month') month?: string) {
    return this.reportsService.getDeveloperWorkload(month);
  }

  @Get('client-summary')
  getClientSummary(@Query('month') month?: string) {
    return this.reportsService.getClientSummary(month);
  }

  @Get('daily')
  getDailySheet(@Query('date') date: string) {
    return this.reportsService.getDailySheet(date);
  }

  @Get('custom')
  getCustomReport(
    @Query('period') period: string,
    @Query('startDate') startDate: string,
    @Query('projectIds') projectIds?: string,
    @Query('developerEmails') developerEmails?: string,
  ) {
    if (!period || !['day', 'week', 'month'].includes(period)) {
      throw new BadRequestException('period must be "day", "week", or "month"');
    }
    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      throw new BadRequestException('startDate must be a valid YYYY-MM-DD date');
    }
    return this.reportsService.getCustomReport({
      period: period as 'day' | 'week' | 'month',
      startDate,
      projectIds: projectIds ? projectIds.split(',').map(Number).filter(Boolean) : undefined,
      developerEmails: developerEmails ? developerEmails.split(',').map((e) => e.trim()).filter(Boolean) : undefined,
    });
  }
}
