import { Controller, Get } from '@nestjs/common';
import { TrashService } from './trash.service';

@Controller('trash')
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Get()
  findAll() {
    return this.trashService.findAll();
  }
}
