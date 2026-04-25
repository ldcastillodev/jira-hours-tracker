import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      monthlyBudget?: number;
      parentId?: string;
    },
  ) {
    return this.projectsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      monthlyBudget?: number;
      parentId?: string | null;
    },
  ) {
    return this.projectsService.update(id, body);
  }
}
