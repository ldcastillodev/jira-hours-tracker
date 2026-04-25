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
    return this.worklogsService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      date: string;
      hours: number;
      isBillable?: boolean;
      projectId: string;
      developerId: string;
      jiraIssueId?: string;
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
      isBillable?: boolean;
      projectId?: string;
      developerId?: string;
    },
  ) {
    return this.worklogsService.update(id, body);
  }
}
