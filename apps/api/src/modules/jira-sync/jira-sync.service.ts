import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

interface JiraWorklog {
  id: string;
  issueId: string;
  author: { accountId: string; displayName: string; emailAddress: string };
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
        maxResults: number;
        worklogs: JiraWorklog[];
      };
      components: Array<{ name: string }>;
    };
  }>;
  nextPageToken?: string;
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
      "Content-Type": "application/json",
    };

    const since = sinceDate || this.defaultSinceDate();
    this.logger.log(`Starting Jira sync since ${since}`);
    const components = await this.prisma.component.findMany().then((comps) => comps.map((c) => c.name));
    this.logger.debug(`Existing components in DB: ${components.join(', ')}`);

    let totalProcessed = 0;
    let upsertedCount = 0;
    let skippedCount = 0;
    let nextPageToken: string | undefined;
    const jiraIssues: JiraSearchResponse['issues'] = [];
    do {
      const jql = `component in (${components.map((c) => `"${c}"`).join(',')}) AND worklogDate >= "${since}"`;
      const url = `${baseUrl}/rest/api/3/search/jql`;
      const body: Record<string, unknown> = {
        jql,
        maxResults: 100,
        fields: ['worklog', 'components'],
      };

      if (nextPageToken) {
        body.nextPageToken = nextPageToken;
      }
      
      const { data } = await firstValueFrom(
        this.httpService.post<JiraSearchResponse>(url, body, {
          headers,
        }),
      );

      jiraIssues.push(...data.issues);

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    for (const issue of jiraIssues) {
      const worklogs = issue.fields.worklog.worklogs;
      const componentName = issue.fields.components?.[0]?.name;

      const allWorklogs =
        issue.fields.worklog.total <= issue.fields.worklog.maxResults
          ? worklogs
          : await this.fetchAllIssueWorklogs(baseUrl, issue.key, headers);

      for (const wl of allWorklogs) {
        const startedDate = new Date(wl.started);
        if (startedDate < new Date(since)) continue;

        const result = await this.upsertWorklog(wl, componentName, issue.key);
        if (result === 'upserted') upsertedCount++;
        else skippedCount++;
        totalProcessed++;
      }
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
    issueKey: string,
    headers: Record<string, string>,
  ): Promise<JiraWorklog[]> {
    const worklogs: JiraWorklog[] = [];
    let startAt = 0;

    do {
      const url = `${baseUrl}/rest/api/3/issue/${issueKey}/worklog?startAt=${startAt}&maxResults=1000`;
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          headers,
        }),
      );

      worklogs.push(...data.worklogs);

      if (startAt + data.maxResults >= data.total) break;
      startAt += data.maxResults;
    } while (true);  

    return worklogs;
  }

  private async upsertWorklog(
    wl: JiraWorklog,
    componentName: string,
    issueKey: string,
  ): Promise<'upserted' | 'skipped'> {
    const component = await this.prisma.component.findFirst({
      where: { name: componentName, deletedAt: null },
    });

    if (!component) {
      this.logger.debug(
        `Skipping worklog ${wl.id}: no component matching "${componentName}"`,
      );
      return 'skipped';
    }

    // Verify the developer exists by email
    const developer = await this.prisma.developer.findUnique({
      where: { email: wl.author.emailAddress },
    });

    if (!developer) {
      this.logger.warn(
        `Skipping worklog ${wl.id}: no developer with email ${wl.author.emailAddress} (${wl.author.displayName})`,
      );
      return 'skipped';
    }

    const hours = wl.timeSpentSeconds / 3600;
    const date = new Date(wl.started);


    await this.prisma.worklog.upsert({
      where: { jiraWorklogId: wl.id },
      update: {
        hours,
        date,
      },
      create: {
        jiraWorklogId: wl.id,
        ticketKey: issueKey,
        date,
        hours,
        assigned: wl.author.emailAddress,
        componentId: component.id,
      },
    });

    return 'upserted';
  }

  private defaultSinceDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
}
