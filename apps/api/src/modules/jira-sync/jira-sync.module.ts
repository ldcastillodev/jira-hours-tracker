import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JiraSyncController } from './jira-sync.controller';
import { JiraSyncService } from './jira-sync.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [JiraSyncController],
  providers: [JiraSyncService],
})
export class JiraSyncModule {}
