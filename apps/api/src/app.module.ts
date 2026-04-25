import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { DevelopersModule } from './modules/developers/developers.module';
import { WorklogsModule } from './modules/worklogs/worklogs.module';
import { ReportsModule } from './modules/reports/reports.module';
import { JiraSyncModule } from './modules/jira-sync/jira-sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProjectsModule,
    DevelopersModule,
    WorklogsModule,
    ReportsModule,
    JiraSyncModule,
  ],
})
export class AppModule {}
