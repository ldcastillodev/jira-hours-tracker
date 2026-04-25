import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class JiraSyncService {
  private readonly logger = new Logger(JiraSyncService.name);

  async syncWorklogs() {
    // Phase 2: Implement Jira API consumption + upsert logic
    this.logger.log('Jira sync triggered — not yet implemented');
    return { status: 'not_implemented', message: 'Jira sync will be implemented in Phase 2' };
  }
}
