import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { WorklogsService } from './worklogs.service';

@Controller('worklogs')
export class WorklogsController {
  constructor(private readonly worklogsService: WorklogsService) {}

  @Get()
  findAll(@Query('month') month?: string) {
    return this.worklogsService.findAll(month);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worklogsService.findOne(+id);
  }

  @Post()
  create(
    @Body()
    body: {
      date: string;
      hours: number;
      jiraWorklogId: string;
      ticketKey: string;
      assigned: string;
      componentId: number;
    },
  ) {
    return this.worklogsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      date?: string;
      hours?: number;
      componentId?: number;
    },
  ) {
    return this.worklogsService.update(+id, body);
  }
}
