import { Module } from '@nestjs/common';
import { JiraSyncController } from './jira-sync.controller';
import { JiraSyncService } from './jira-sync.service';

@Module({
  controllers: [JiraSyncController],
  providers: [JiraSyncService],
})
export class JiraSyncModule {}
