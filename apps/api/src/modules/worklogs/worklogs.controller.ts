import { Controller, Get, Query } from '@nestjs/common';
import { WorklogsService } from './worklogs.service';

@Controller('worklogs')
export class WorklogsController {
  constructor(private readonly worklogsService: WorklogsService) {}

  @Get()
  findAll(@Query('month') month?: string) {
    return this.worklogsService.findAll(month);
  }
}
