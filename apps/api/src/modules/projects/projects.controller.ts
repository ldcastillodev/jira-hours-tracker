import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateComponentDto } from './dto/create-component.dto';
import { UpdateComponentDto } from './dto/update-component.dto';
import { ActivateProjectQueryDto } from './dto/activate-project-query.dto';

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
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(+id, dto);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.delete(+id);
  }

  @Patch(':id/activate')
  activateProject(@Param('id') id: string, @Query() query: ActivateProjectQueryDto) {
    if (query.cascade) {
      return this.projectsService.activateProjectCascade(+id);
    }
    return this.projectsService.activateProject(+id);
  }

  // --- Component endpoints ---

  @Get(':id/components')
  findComponents(@Param('id') id: string) {
    return this.projectsService.findComponents(+id);
  }

  @Post(':id/components')
  createComponent(@Param('id') id: string, @Body() dto: CreateComponentDto) {
    return this.projectsService.createComponent(+id, dto);
  }

  @Patch('components/:compId')
  updateComponent(@Param('compId') compId: string, @Body() dto: UpdateComponentDto) {
    return this.projectsService.updateComponent(+compId, dto);
  }

  @Delete('components/:compId')
  deleteComponent(@Param('compId') compId: string) {
    return this.projectsService.deleteComponent(+compId);
  }

  @Patch('components/:compId/activate')
  activateComponent(@Param('compId') compId: string) {
    return this.projectsService.activateComponent(+compId);
  }
}
