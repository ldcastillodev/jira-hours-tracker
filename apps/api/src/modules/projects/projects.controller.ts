import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query } from '@nestjs/common';
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
    return this.projectsService.findOne(+id);
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      monthlyBudget: number;
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
    },
  ) {
    return this.projectsService.update(+id, body);
  }

  @Patch(':id')
  patch(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      monthlyBudget?: number;
    },
  ) {
    return this.projectsService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.delete(+id);
  }

  @Patch(':id/restore')
  restoreProject(
    @Param('id') id: string,
    @Query('cascade') cascade?: string,
  ) {
    if (cascade === '1' || cascade === 'true') {
      return this.projectsService.restoreProjectCascade(+id);
    }
    return this.projectsService.restoreProject(+id);
  }

  // --- Component endpoints ---

  @Get(':id/components')
  findComponents(@Param('id') id: string) {
    return this.projectsService.findComponents(+id);
  }

  @Post(':id/components')
  createComponent(
    @Param('id') id: string,
    @Body() body: { name: string; isBillable: boolean },
  ) {
    return this.projectsService.createComponent(+id, body);
  }

  @Patch('components/:compId')
  updateComponent(
    @Param('compId') compId: string,
    @Body() body: { name?: string; isBillable?: boolean },
  ) {
    return this.projectsService.updateComponent(+compId, body);
  }

  @Delete('components/:compId')
  deleteComponent(@Param('compId') compId: string) {
    return this.projectsService.deleteComponent(+compId);
  }

  @Patch('components/:compId/restore')
  restoreComponent(@Param('compId') compId: string) {
    return this.projectsService.restoreComponent(+compId);
  }
}
