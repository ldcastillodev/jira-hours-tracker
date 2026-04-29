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
    private readonly configService: ConfigService
  ) {}

  async syncWorklogs(startDate: string, endDate: string) {
    const baseUrl = this.configService.get<string>('JIRA_BASE_URL');
    const email = this.configService.get<string>('JIRA_EMAIL');
    const apiToken = this.configService.get<string>('JIRA_API_TOKEN');

    if (!baseUrl || !email || !apiToken) {
      this.logger.warn('Jira credentials not configured — skipping sync');
      return { status: 'skipped' as const, message: 'Jira credentials not configured' };
    }

    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime() + 24 * 60 * 60 * 1000; // exclusive end of day
    this.logger.log(`Starting Jira sync: ${startDate} to ${endDate}`);

    // ── Step 1: Load DB lookup tables once ──────────────────────────────────
    const [dbComponents, dbDevelopers] = await Promise.all([
      this.prisma.component.findMany({ where: { deletedAt: null } }),
      this.prisma.developer.findMany(),
    ]);

    const componentMap = new Map(dbComponents.map((c) => [c.name, c.id]));
    const developerEmails = new Set(dbDevelopers.map((d) => d.email));

    this.logger.debug(
      `Loaded ${componentMap.size} components, ${developerEmails.size} developers from DB`
    );

    // ── Step 2: Paginate Jira search API (unchanged) ─────────────────────────
    const componentNames = dbComponents.map((c) => c.name);
    const jiraIssues: JiraSearchResponse['issues'] = [];
    let nextPageToken: string | undefined;

    do {
      const jql = `component in (${componentNames.map((c) => `"${c}"`).join(',')}) AND worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`;
      const url = `${baseUrl}/rest/api/3/search/jql`;
      const body: Record<string, unknown> = {
        jql,
        maxResults: 100,
        fields: ['worklog', 'components'],
      };
      if (nextPageToken) body.nextPageToken = nextPageToken;

      const { data } = await firstValueFrom(
        this.httpService.post<JiraSearchResponse>(url, body, { headers })
      );
      jiraIssues.push(...data.issues);
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    // ── Step 3: Flatten all worklogs from all issues ──────────────────────────
    interface RawEntry {
      wl: JiraWorklog;
      componentName: string;
      issueKey: string;
    }
    const rawEntries: RawEntry[] = [];

    for (const issue of jiraIssues) {
      const componentName = issue.fields.components?.[0]?.name;
      const worklogs =
        issue.fields.worklog.total <= issue.fields.worklog.maxResults
          ? issue.fields.worklog.worklogs
          : await this.fetchAllIssueWorklogs(baseUrl, issue.key, headers);

      for (const wl of worklogs) {
        const ts = new Date(wl.started).getTime();
        if (ts >= startMs && ts < endMs) {
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
          `Skipping worklog ${wl.id}: no developer with email ${wl.author.emailAddress}`
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

    this.logger.log(`${records.length} valid worklogs from Jira, ${skippedCount} skipped`);

    // ── Step 5: Load all existing DB worklogs for the date range (1 query) ──
    const dbWorklogs = await this.prisma.worklog.findMany({
      where: {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
        deletedAt: null,
      },
      select: { jiraWorklogId: true, hours: true, date: true, ticketKey: true },
    });

    const dbMap = new Map(dbWorklogs.map((w) => [w.jiraWorklogId, w]));
    const dbIdSet = new Set(dbWorklogs.map((w) => w.jiraWorklogId));

    this.logger.debug(`Found ${dbMap.size} existing worklogs in DB for date range`);

    // ── Step 6: Three-way in-memory split (0 queries) ────────────────────────
    interface UpsertRecord {
      jiraWorklogId: string;
      ticketKey: string;
      assigned: string;
      hours: number;
      date: Date;
      componentId: number;
    }

    const toCreate: UpsertRecord[] = [];
    const toUpdate: UpsertRecord[] = [];

    for (const record of records) {
      const existing = dbMap.get(record.jiraWorklogId);
      if (!existing) {
        toCreate.push(record);
      } else {
        const hoursChanged = Math.abs(Number(existing.hours) - record.hours) > 0.0001;
        const dateChanged = (existing.date as Date).getTime() !== record.date.getTime();
        const ticketChanged = existing.ticketKey !== record.ticketKey;
        if (hoursChanged || dateChanged || ticketChanged) {
          toUpdate.push(record);
        }
        // else: unchanged — skip entirely (no write)
      }
    }

    const jiraIdSet = new Set(records.map((r) => r.jiraWorklogId));
    const toSoftDelete = [...dbIdSet].filter((id) => !jiraIdSet.has(id));
    const unchangedCount = records.length - toCreate.length - toUpdate.length;

    this.logger.log(
      `Split: ${toCreate.length} to create, ${toUpdate.length} to update, ` +
        `${unchangedCount} unchanged, ${toSoftDelete.length} to soft-delete`
    );

    // ── Step 7: Batch write in chunks of 200 ────────────────────────────────
    const CHUNK_SIZE = 200;
    let totalInserted = 0;
    let totalUpdated = 0;

    // Process creates
    const createChunks = Math.ceil(toCreate.length / CHUNK_SIZE);
    for (let i = 0; i < toCreate.length; i += CHUNK_SIZE) {
      const chunk = toCreate.slice(i, i + CHUNK_SIZE);
      const chunkIdx = Math.floor(i / CHUNK_SIZE) + 1;
      try {
        await this.prisma.worklog.createMany({ data: chunk });
        totalInserted += chunk.length;
        this.logger.log(`Create chunk ${chunkIdx}/${createChunks}: ${chunk.length} inserted`);
      } catch (err) {
        this.logger.error(
          `Create chunk ${chunkIdx}/${createChunks} failed: ${(err as Error).message}`
        );
      }
    }

    // Process updates
    const updateChunks = Math.ceil(toUpdate.length / CHUNK_SIZE);
    for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
      const chunk = toUpdate.slice(i, i + CHUNK_SIZE);
      const chunkIdx = Math.floor(i / CHUNK_SIZE) + 1;
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const r of chunk) {
            await tx.worklog.update({
              where: { jiraWorklogId: r.jiraWorklogId },
              data: { hours: r.hours, date: r.date, ticketKey: r.ticketKey },
            });
          }
        });
        totalUpdated += chunk.length;
        this.logger.log(`Update chunk ${chunkIdx}/${updateChunks}: ${chunk.length} updated`);
      } catch (err) {
        this.logger.error(
          `Update chunk ${chunkIdx}/${updateChunks} failed: ${(err as Error).message}`
        );
      }
    }

    // Soft-delete orphans in one bulk statement
    let totalDeleted = 0;
    if (toSoftDelete.length > 0) {
      try {
        const result = await this.prisma.worklog.updateMany({
          where: { jiraWorklogId: { in: toSoftDelete } },
          data: { deletedAt: new Date() },
        });
        totalDeleted = result.count;
        this.logger.log(`Soft-deleted ${totalDeleted} orphaned worklogs`);
      } catch (err) {
        this.logger.error(`Soft-delete failed: ${(err as Error).message}`);
      }
    }

    this.logger.log(
      `Sync complete: ${totalInserted} inserted, ${totalUpdated} updated, ` +
        `${totalDeleted} deleted, ${unchangedCount} unchanged, ${skippedCount} skipped`
    );

    return {
      status: 'completed' as const,
      inserted: totalInserted,
      updated: totalUpdated,
      deleted: totalDeleted,
      unchanged: unchangedCount,
      skippedCount,
    };
  }

  private async fetchAllIssueWorklogs(
    baseUrl: string,
    issueKey: string,
    headers: Record<string, string>
  ): Promise<JiraWorklog[]> {
    const worklogs: JiraWorklog[] = [];
    let startAt = 0;

    do {
      const url = `${baseUrl}/rest/api/3/issue/${issueKey}/worklog?startAt=${startAt}&maxResults=1000`;
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          headers,
        })
      );

      worklogs.push(...data.worklogs);

      if (startAt + data.maxResults >= data.total) break;
      startAt += data.maxResults;
    } while (true);

    return worklogs;
  }
}
