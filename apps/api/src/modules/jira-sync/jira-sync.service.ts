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
    const sinceMs = new Date(since).getTime();
    this.logger.log(`Starting Jira sync since ${since}`);

    // ── Step 1: Load DB lookup tables once ──────────────────────────────────
    const [dbComponents, dbDevelopers] = await Promise.all([
      this.prisma.component.findMany({ where: { deletedAt: null } }),
      this.prisma.developer.findMany(),
    ]);

    const componentMap = new Map(dbComponents.map((c) => [c.name, c.id]));
    const developerEmails = new Set(dbDevelopers.map((d) => d.email));

    this.logger.debug(
      `Loaded ${componentMap.size} components, ${developerEmails.size} developers from DB`,
    );

    // ── Step 2: Paginate Jira search API (unchanged) ─────────────────────────
    const componentNames = dbComponents.map((c) => c.name);
    const jiraIssues: JiraSearchResponse['issues'] = [];
    let nextPageToken: string | undefined;

    do {
      const jql = `component in (${componentNames.map((c) => `"${c}"`).join(',')}) AND worklogDate >= "${since}"`;
      const url = `${baseUrl}/rest/api/3/search/jql`;
      const body: Record<string, unknown> = {
        jql,
        maxResults: 100,
        fields: ['worklog', 'components'],
      };
      if (nextPageToken) body.nextPageToken = nextPageToken;

      const { data } = await firstValueFrom(
        this.httpService.post<JiraSearchResponse>(url, body, { headers }),
      );
      jiraIssues.push(...data.issues);
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    // ── Step 3: Flatten all worklogs from all issues ──────────────────────────
    interface RawEntry { wl: JiraWorklog; componentName: string; issueKey: string; }
    const rawEntries: RawEntry[] = [];

    for (const issue of jiraIssues) {
      const componentName = issue.fields.components?.[0]?.name;
      const worklogs =
        issue.fields.worklog.total <= issue.fields.worklog.maxResults
          ? issue.fields.worklog.worklogs
          : await this.fetchAllIssueWorklogs(baseUrl, issue.key, headers);

      for (const wl of worklogs) {
        if (new Date(wl.started).getTime() >= sinceMs) {
          rawEntries.push({ wl, componentName, issueKey: issue.key });
        }
      }
    }

    this.logger.log(`Fetched ${rawEntries.length} worklogs from Jira (after date filter)`);

    // ── Step 4: Validate + transform in memory ────────────────────────────────
    interface UpsertRecord {
      jiraWorklogId: string;
      ticketKey: string;
      assigned: string;
      hours: number;
      date: Date;
      componentId: number;
    }
    const records: UpsertRecord[] = [];
    let skippedCount = 0;

    for (const { wl, componentName, issueKey } of rawEntries) {
      const componentId = componentMap.get(componentName);
      if (!componentId) {
        this.logger.debug(`Skipping worklog ${wl.id}: no component matching "${componentName}"`);
        skippedCount++;
        continue;
      }
      if (!developerEmails.has(wl.author.emailAddress)) {
        this.logger.debug(
          `Skipping worklog ${wl.id}: no developer with email ${wl.author.emailAddress}`,
        );
        skippedCount++;
        continue;
      }
      records.push({
        jiraWorklogId: wl.id,
        ticketKey: issueKey,
        assigned: wl.author.emailAddress,
        hours: wl.timeSpentSeconds / 3600,
        date: new Date(wl.started),
        componentId,
      });
    }

    this.logger.log(`${records.length} valid worklogs to upsert, ${skippedCount} skipped`);

    // ── Step 5: Batch upsert in chunks of 200 ────────────────────────────────
    const CHUNK_SIZE = 200;
    const totalChunks = Math.ceil(records.length / CHUNK_SIZE);
    let totalInserted = 0;
    let totalUpdated = 0;

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;

      try {
        const { inserted, updated } = await this.batchUpsertChunk(chunk);
        totalInserted += inserted;
        totalUpdated += updated;
        this.logger.log(
          `Chunk ${chunkIndex}/${totalChunks}: ${inserted} inserted, ${updated} updated`,
        );
      } catch (err) {
        this.logger.error(
          `Chunk ${chunkIndex}/${totalChunks} failed (IDs ${chunk[0].jiraWorklogId}…${chunk[chunk.length - 1].jiraWorklogId}): ${(err as Error).message}`,
        );
      }
    }

    const totalProcessed = totalInserted + totalUpdated;
    this.logger.log(
      `Sync complete: ${totalProcessed} processed (${totalInserted} inserted, ${totalUpdated} updated), ${skippedCount} skipped`,
    );

    return {
      status: 'completed',
      since,
      totalProcessed,
      inserted: totalInserted,
      updated: totalUpdated,
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

  private async batchUpsertChunk(
    records: Array<{
      jiraWorklogId: string;
      ticketKey: string;
      assigned: string;
      hours: number;
      date: Date;
      componentId: number;
    }>,
  ): Promise<{ inserted: number; updated: number }> {
    const ids = records.map((r) => r.jiraWorklogId);

    const existing = await this.prisma.worklog.findMany({
      where: { jiraWorklogId: { in: ids } },
      select: { jiraWorklogId: true },
    });
    const existingIdSet = new Set(existing.map((w) => w.jiraWorklogId));

    const toCreate = records.filter((r) => !existingIdSet.has(r.jiraWorklogId));
    const toUpdate = records.filter((r) => existingIdSet.has(r.jiraWorklogId));

    await this.prisma.$transaction(async (tx) => {
      if (toCreate.length > 0) {
        await tx.worklog.createMany({ data: toCreate });
      }
      for (const r of toUpdate) {
        await tx.worklog.update({
          where: { jiraWorklogId: r.jiraWorklogId },
          data: { hours: r.hours, date: r.date },
        });
      }
    });

    return { inserted: toCreate.length, updated: toUpdate.length };
  }

  private defaultSinceDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
}
