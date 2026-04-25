import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

interface JiraWorklog {
  id: string;
  issueId: string;
  author: { accountId: string; displayName: string; emailAddress?: string };
  started: string;
  timeSpentSeconds: number;
}

interface JiraSearchResponse {
  issues: Array<{
    id: string;
    key: string;
    fields: {
      worklog: {
        total: number;
        worklogs: JiraWorklog[];
      };
    };
  }>;
  total: number;
  startAt: number;
  maxResults: number;
}

@Injectable()
export class JiraSyncService {
  private readonly logger = new Logger(JiraSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async syncWorklogs(sinceDate?: string) {
    const baseUrl = this.configService.get<string>('JIRA_BASE_URL');
    const email = this.configService.get<string>('JIRA_EMAIL');
    const apiToken = this.configService.get<string>('JIRA_API_TOKEN');

    if (!baseUrl || !email || !apiToken) {
      this.logger.warn('Jira credentials not configured — skipping sync');
      return { status: 'skipped', message: 'Jira credentials not configured' };
    }

    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    };

    const since = sinceDate || this.defaultSinceDate();
    this.logger.log(`Starting Jira sync since ${since}`);

    let startAt = 0;
    const maxResults = 50;
    let totalProcessed = 0;
    let upsertedCount = 0;
    let skippedCount = 0;

    let hasMore = true;
    while (hasMore) {
      const jql = `worklogDate >= "${since}" ORDER BY updated DESC`;
      const url = `${baseUrl}/rest/api/3/search`;

      const { data } = await firstValueFrom(
        this.httpService.get<JiraSearchResponse>(url, {
          headers,
          params: {
            jql,
            startAt,
            maxResults,
            fields: 'worklog',
          },
        }),
      );

      for (const issue of data.issues) {
        const worklogs = issue.fields.worklog.worklogs;

        const allWorklogs =
          issue.fields.worklog.total > worklogs.length
            ? await this.fetchAllIssueWorklogs(baseUrl, issue.id, headers)
            : worklogs;

        for (const wl of allWorklogs) {
          const startedDate = new Date(wl.started);
          if (startedDate < new Date(since)) continue;

          const result = await this.upsertWorklog(wl, issue.key);
          if (result === 'upserted') upsertedCount++;
          else skippedCount++;
          totalProcessed++;
        }
      }

      startAt += data.issues.length;
      hasMore = startAt < data.total;
    }

    this.logger.log(
      `Sync complete: ${totalProcessed} processed, ${upsertedCount} upserted, ${skippedCount} skipped`,
    );

    return {
      status: 'completed',
      since,
      totalProcessed,
      upsertedCount,
      skippedCount,
    };
  }

  private async fetchAllIssueWorklogs(
    baseUrl: string,
    issueId: string,
    headers: Record<string, string>,
  ): Promise<JiraWorklog[]> {
    const all: JiraWorklog[] = [];
    let startAt = 0;
    const maxResults = 100;
    let hasMore = true;

    while (hasMore) {
      const url = `${baseUrl}/rest/api/3/issue/${issueId}/worklog`;
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          headers,
          params: { startAt, maxResults },
        }),
      );

      all.push(...data.worklogs);
      startAt += data.worklogs.length;
      hasMore = startAt < data.total;
    }

    return all;
  }

  private async upsertWorklog(
    wl: JiraWorklog,
    issueKey: string,
  ): Promise<'upserted' | 'skipped'> {
    const developer = await this.prisma.developer.findUnique({
      where: { jiraAccountId: wl.author.accountId },
    });

    if (!developer) {
      this.logger.debug(
        `Skipping worklog ${wl.id}: no developer for Jira account ${wl.author.accountId} (${wl.author.displayName})`,
      );
      return 'skipped';
    }

    const project = await this.resolveProject(issueKey);
    if (!project) {
      this.logger.debug(
        `Skipping worklog ${wl.id}: no project for issue ${issueKey}`,
      );
      return 'skipped';
    }

    const hours = wl.timeSpentSeconds / 3600;
    const date = new Date(wl.started);
    date.setUTCHours(0, 0, 0, 0);

    await this.prisma.worklog.upsert({
      where: { jiraIssueId: wl.id },
      update: {
        hours,
        date,
        isBillable: true,
      },
      create: {
        jiraIssueId: wl.id,
        date,
        hours,
        isBillable: true,
        projectId: project.id,
        developerId: developer.id,
      },
    });

    return 'upserted';
  }

  private async resolveProject(issueKey: string) {
    const prefix = issueKey.split('-')[0];
    return (
      (await this.prisma.project.findFirst({
        where: { name: { contains: prefix, mode: 'insensitive' } },
      })) ?? null
    );
  }

  private defaultSinceDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
}
