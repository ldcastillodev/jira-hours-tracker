import { Controller, Post } from '@nestjs/common';
import { JiraSyncService } from './jira-sync.service';

@Controller('jira-sync')
export class JiraSyncController {
  constructor(private readonly jiraSyncService: JiraSyncService) {}

  @Post('trigger')
  triggerSync() {
    return this.jiraSyncService.syncWorklogs();
  }
}
