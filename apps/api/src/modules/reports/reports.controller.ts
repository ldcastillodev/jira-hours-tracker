import { Controller, Get, Query } from '@nestjs/common';
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
}
