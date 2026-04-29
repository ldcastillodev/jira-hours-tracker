import { Controller, Get } from '@nestjs/common';
import { InactiveService } from './inactive.service';

@Controller('inactive')
export class InactiveController {
  constructor(private readonly inactiveService: InactiveService) {}

  @Get()
  findAll() {
    return this.inactiveService.findAll();
  }
}
