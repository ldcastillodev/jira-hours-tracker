import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { JiraSyncService } from './jira-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../../test/helpers/mock-prisma';
import { DUMMY_COMPONENTS, DUMMY_DEVELOPERS } from '../../../test/fixtures/dummy-data';
import { DUMMY_JIRA_SEARCH_RESPONSE } from '../../../test/mocks/jira-responses';

const START_DATE = '2026-01-01';
const END_DATE = '2026-01-31';

function makeHttpService(searchResponse = DUMMY_JIRA_SEARCH_RESPONSE) {
  return {
    post: jest.fn().mockReturnValue(of({ data: searchResponse })),
    get: jest.fn(),
  };
}

function makeConfigService(hasCredentials = true) {
  const get = jest.fn();
  if (hasCredentials) {
    get
      .mockReturnValueOnce('https://test.jira.example.com') // JIRA_BASE_URL
      .mockReturnValueOnce('test@example.com') // JIRA_EMAIL
      .mockReturnValueOnce('test-token'); // JIRA_API_TOKEN
  } else {
    get.mockReturnValue(undefined);
  }
  return { get };
}

describe('JiraSyncService', () => {
  let service: JiraSyncService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  async function build(httpService: any, configService: any) {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        JiraSyncService,
        { provide: PrismaService, useValue: prisma },
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();
    service = module.get(JiraSyncService);
  }

  it('returns skipped when Jira credentials are not configured', async () => {
    await build(makeHttpService(), makeConfigService(false));

    const result = await service.syncWorklogs(START_DATE, END_DATE);

    expect(result.status).toBe('skipped');
  });

  it('inserts new worklogs from Jira (toCreate path)', async () => {
    await build(makeHttpService(), makeConfigService());

    // DB lookup tables
    prisma.component.findMany.mockResolvedValue(DUMMY_COMPONENTS);
    prisma.developer.findMany.mockResolvedValue(DUMMY_DEVELOPERS);
    // No existing worklogs in DB for range
    prisma.worklog.findMany.mockResolvedValue([]);
    prisma.worklog.createMany.mockResolvedValue({ count: 2 });

    const result = await service.syncWorklogs(START_DATE, END_DATE);

    expect(result.status).toBe('completed');
    expect(result.inserted).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.deleted).toBe(0);
    expect(result.unchanged).toBe(0);
  });

  it('updates changed worklogs (toUpdate path)', async () => {
    await build(makeHttpService(), makeConfigService());

    prisma.component.findMany.mockResolvedValue(DUMMY_COMPONENTS);
    prisma.developer.findMany.mockResolvedValue(DUMMY_DEVELOPERS);

    // DB has the same jiraWorklogId but wl-001 has different hours
    // Dates match Jira's started timestamp to isolate the hours-change detection
    prisma.worklog.findMany.mockResolvedValue([
      {
        jiraWorklogId: 'jira-wl-new-001',
        hours: 4, // Jira says 8h (28800s / 3600) → changed
        date: new Date('2026-01-05T09:00:00.000Z'),
        ticketKey: 'TEST-10',
      },
      {
        jiraWorklogId: 'jira-wl-new-002',
        hours: 4, // Jira says 4h (14400s / 3600) → unchanged
        date: new Date('2026-01-05T09:00:00.000Z'),
        ticketKey: 'TEST-10',
      },
    ]);

    // Mock $transaction to call callback with mock tx
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
    prisma.worklog.update.mockResolvedValue({});

    const result = await service.syncWorklogs(START_DATE, END_DATE);

    expect(result.updated).toBe(1); // only wl-001 changed hours (4 → 8)
    expect(result.unchanged).toBe(1);
  });

  it('skips unchanged worklogs', async () => {
    await build(makeHttpService(), makeConfigService());

    prisma.component.findMany.mockResolvedValue(DUMMY_COMPONENTS);
    prisma.developer.findMany.mockResolvedValue(DUMMY_DEVELOPERS);

    // DB has exact same data as Jira — dates match Jira's started timestamp
    prisma.worklog.findMany.mockResolvedValue([
      {
        jiraWorklogId: 'jira-wl-new-001',
        hours: 8, // same as Jira (28800s / 3600 = 8)
        date: new Date('2026-01-05T09:00:00.000Z'),
        ticketKey: 'TEST-10',
      },
      {
        jiraWorklogId: 'jira-wl-new-002',
        hours: 4, // same as Jira (14400s / 3600 = 4)
        date: new Date('2026-01-05T09:00:00.000Z'),
        ticketKey: 'TEST-10',
      },
    ]);

    const result = await service.syncWorklogs(START_DATE, END_DATE);

    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.unchanged).toBe(2);
    expect(prisma.worklog.createMany).not.toHaveBeenCalled();
  });

  it('soft-deletes orphaned worklogs not present in Jira response', async () => {
    await build(makeHttpService(), makeConfigService());

    prisma.component.findMany.mockResolvedValue(DUMMY_COMPONENTS);
    prisma.developer.findMany.mockResolvedValue(DUMMY_DEVELOPERS);

    // DB has one worklog that Jira no longer returns
    prisma.worklog.findMany.mockResolvedValue([
      {
        jiraWorklogId: 'jira-wl-orphan-999', // not in Jira response
        hours: 8,
        date: new Date('2026-01-05T00:00:00.000Z'),
        ticketKey: 'TEST-OLD',
      },
    ]);
    prisma.worklog.createMany.mockResolvedValue({ count: 2 }); // new worklogs inserted
    prisma.worklog.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.syncWorklogs(START_DATE, END_DATE);

    expect(result.deleted).toBe(1);
    expect(prisma.worklog.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jiraWorklogId: { in: ['jira-wl-orphan-999'] } },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    );
  });

  it('skips worklogs with unknown component name', async () => {
    const responseWithUnknownComponent = {
      issues: [
        {
          id: 'issue-999',
          key: 'TEST-99',
          fields: {
            components: [{ name: 'Unknown Component XYZ' }],
            worklog: {
              total: 1,
              maxResults: 50,
              worklogs: [
                {
                  id: 'jira-wl-skip-001',
                  issueId: 'issue-999',
                  author: {
                    accountId: 'test-account-1',
                    displayName: 'Test Dev One',
                    emailAddress: 'test.dev1@example.com',
                  },
                  started: '2026-01-05T09:00:00.000+0000',
                  timeSpentSeconds: 3600,
                },
              ],
            },
          },
        },
      ],
      nextPageToken: undefined,
    };

    await build(makeHttpService(responseWithUnknownComponent), makeConfigService());

    prisma.component.findMany.mockResolvedValue(DUMMY_COMPONENTS);
    prisma.developer.findMany.mockResolvedValue(DUMMY_DEVELOPERS);
    prisma.worklog.findMany.mockResolvedValue([]);

    const result = await service.syncWorklogs(START_DATE, END_DATE);

    expect(result.inserted).toBe(0);
    expect(result.skippedCount).toBe(1);
  });
});
