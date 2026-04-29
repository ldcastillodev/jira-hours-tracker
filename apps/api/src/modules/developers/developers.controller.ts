import { Controller, Get, Post, Put, Patch, Delete, Param, Body } from '@nestjs/common';
import { DevelopersService } from './developers.service';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

@Controller('developers')
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  @Get()
  findAll() {
    return this.developersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.developersService.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateDeveloperDto) {
    return this.developersService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDeveloperDto) {
    return this.developersService.update(+id, dto);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: UpdateDeveloperDto) {
    return this.developersService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.developersService.delete(+id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.developersService.activateDeveloper(+id);
  }
}
