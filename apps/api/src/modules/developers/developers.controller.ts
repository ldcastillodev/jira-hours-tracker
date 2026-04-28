import { Controller, Get, Post, Put, Patch, Delete, Param, Body } from '@nestjs/common';
import { DevelopersService } from './developers.service';

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
  create(
    @Body()
    body: {
      name: string;
      email: string;
      slackId?: string;
    },
  ) {
    return this.developersService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      slackId?: string | null;
    },
  ) {
    return this.developersService.update(+id, body);
  }

  @Patch(':id')
  patch(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      slackId?: string | null;
    },
  ) {
    return this.developersService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.developersService.delete(+id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.developersService.restoreDeveloper(+id);
  }
}
