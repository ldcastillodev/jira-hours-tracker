import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { DevelopersModule } from './modules/developers/developers.module';
import { WorklogsModule } from './modules/worklogs/worklogs.module';
import { ReportsModule } from './modules/reports/reports.module';
import { JiraSyncModule } from './modules/jira-sync/jira-sync.module';
import { InactiveModule } from './modules/inactive/inactive.module';
import { RepairsModule } from './modules/repairs/repairs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    PrismaModule,
    HealthModule,
    ProjectsModule,
    DevelopersModule,
    WorklogsModule,
    ReportsModule,
    JiraSyncModule,
    InactiveModule,
    RepairsModule,
  ],
})
export class AppModule {}
