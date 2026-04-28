import { Controller, Post, Param } from '@nestjs/common';
import { RepairsService } from './repairs.service';

@Controller('repairs')
export class RepairsController {
  constructor(private readonly repairsService: RepairsService) {}

  @Post('component/:id/sync')
  syncComponent(@Param('id') id: string) {
    return this.repairsService.syncComponent(+id);
  }
}
