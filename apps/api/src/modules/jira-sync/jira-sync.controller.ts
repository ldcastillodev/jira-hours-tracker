import { Controller, Post, Query } from '@nestjs/common';
import { JiraSyncService } from './jira-sync.service';

@Controller('jira-sync')
export class JiraSyncController {
  constructor(private readonly jiraSyncService: JiraSyncService) {}

  @Post('trigger')
  triggerSync(@Query('since') since?: string) {
    return this.jiraSyncService.syncWorklogs(since);
  }
}
