import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { WorklogsService } from './worklogs.service';
import { GetWorklogsQueryDto } from './dto/get-worklogs-query.dto';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';

@Controller('worklogs')
export class WorklogsController {
  constructor(private readonly worklogsService: WorklogsService) {}

  @Get()
  findAll(@Query() query: GetWorklogsQueryDto) {
    return this.worklogsService.findAll(query.month);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worklogsService.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateWorklogDto) {
    return this.worklogsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorklogDto) {
    return this.worklogsService.update(+id, dto);
  }
}
