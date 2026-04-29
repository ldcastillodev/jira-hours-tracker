import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { MonthQueryDto } from './dto/month-query.dto';
import { GetDailyQueryDto } from './dto/get-daily-query.dto';
import { GetCustomReportQueryDto } from './dto/get-custom-report-query.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('client-hours')
  getClientHours(@Query() query: MonthQueryDto) {
    return this.reportsService.getClientHours(query.month);
  }

  @Get('developer-workload')
  getDeveloperWorkload(@Query() query: MonthQueryDto) {
    return this.reportsService.getDeveloperWorkload(query.month);
  }

  @Get('client-summary')
  getClientSummary(@Query() query: MonthQueryDto) {
    return this.reportsService.getClientSummary(query.month);
  }

  @Get('daily')
  getDailySheet(@Query() query: GetDailyQueryDto) {
    return this.reportsService.getDailySheet(query.date);
  }

  @Get('custom')
  getCustomReport(@Query() query: GetCustomReportQueryDto) {
    return this.reportsService.getCustomReport(query);
  }
}
