import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../../test/helpers/mock-prisma';
import {
  DUMMY_PROJECTS,
  DUMMY_COMPONENTS,
  DUMMY_DEVELOPERS,
  DUMMY_WORKLOGS,
} from '../../../test/fixtures/dummy-data';

const componentAlphaWithProject = { ...DUMMY_COMPONENTS[0], project: DUMMY_PROJECTS[0] };
const componentBetaWithProject = { ...DUMMY_COMPONENTS[1], project: DUMMY_PROJECTS[1] };

// Worklogs with nested component+project for custom report queries
const worklogWithNested = {
  ...DUMMY_WORKLOGS[0],
  date: new Date('2026-01-05T00:00:00.000Z'),
  component: { ...componentAlphaWithProject },
};

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ReportsService);
  });

  describe('getClientHours', () => {
    it('aggregates billable and non-billable hours across projects', async () => {
      // Project Alpha: billable, 100 budget, 8 hours used
      const activeProject = {
        ...DUMMY_PROJECTS[0],
        components: [
          {
            ...DUMMY_COMPONENTS[0],
            worklogs: [{ hours: 8 }],
          },
        ],
      };
      prisma.project.findMany.mockResolvedValue([activeProject]);
      prisma.worklog.findMany.mockResolvedValue([]); // no inactive project worklogs

      const result = await service.getClientHours();

      expect(result.totalUsed).toBe(8);
      expect(result.totalContracted).toBe(100);
      expect(result.clients).toHaveLength(1);
      expect(result.clients[0].used).toBe(8);
      expect(result.clients[0].remaining).toBe(92);
    });

    it('counts overBudgetCount when project exceeds budget', async () => {
      const overBudgetProject = {
        ...DUMMY_PROJECTS[0],
        monthlyBudget: 5,
        components: [
          {
            ...DUMMY_COMPONENTS[0],
            worklogs: [{ hours: 10 }], // 10h used, 5h budget
          },
        ],
      };
      prisma.project.findMany.mockResolvedValue([overBudgetProject]);
      prisma.worklog.findMany.mockResolvedValue([]);

      const result = await service.getClientHours();

      expect(result.overBudgetCount).toBe(1);
      expect(result.clients[0].remaining).toBe(-5);
    });
  });

  describe('getDeveloperWorkload', () => {
    it('aggregates hours by developer email', async () => {
      // dev1 on billable component, dev3 on non-billable component
      const wlBillable = { ...DUMMY_WORKLOGS[0], component: DUMMY_COMPONENTS[0] }; // dev1, billable, 8h
      const wlNonBillable = { ...DUMMY_WORKLOGS[3], component: DUMMY_COMPONENTS[1] }; // dev3, non-billable, 2h

      prisma.worklog.findMany.mockResolvedValue([wlBillable, wlNonBillable]);
      prisma.developer.findMany.mockResolvedValue(DUMMY_DEVELOPERS);

      const result = await service.getDeveloperWorkload('2026-01');

      expect(result.month).toBe('2026-01');
      expect(result.developers).toHaveLength(2);

      const dev1 = result.developers.find((d) => d.developerName === 'Test Dev One')!;
      expect(dev1.billableHours).toBe(8);
      expect(dev1.nonBillableHours).toBe(0);
      expect(dev1.totalHours).toBe(8);

      const dev3 = result.developers.find((d) => d.developerName === 'Test Dev Three')!;
      expect(dev3.nonBillableHours).toBe(2);
    });
  });

  describe('getClientSummary', () => {
    it('returns components with total hours', async () => {
      const compWithWorklogs = {
        ...componentAlphaWithProject,
        worklogs: [{ hours: 8 }, { hours: 4 }],
      };
      prisma.component.findMany.mockResolvedValue([compWithWorklogs]);

      const result = await service.getClientSummary('2026-01');

      expect(result.month).toBe('2026-01');
      expect(result.components).toHaveLength(1);
      expect(result.components[0].totalHours).toBe(12);
    });

    it('excludes inactive components with zero hours', async () => {
      const inactiveNoHours = {
        ...componentAlphaWithProject,
        deletedAt: new Date(),
        worklogs: [],
      };
      prisma.component.findMany.mockResolvedValue([inactiveNoHours]);

      const result = await service.getClientSummary('2026-01');

      expect(result.components).toHaveLength(0);
    });
  });

  describe('getDailySheet', () => {
    it('returns entries for the specified date', async () => {
      const worklogWithComp = { ...DUMMY_WORKLOGS[0], component: DUMMY_COMPONENTS[0] };
      prisma.worklog.findMany.mockResolvedValue([worklogWithComp]);
      prisma.developer.findMany.mockResolvedValue(DUMMY_DEVELOPERS);

      const result = await service.getDailySheet('2026-01-01');

      expect(result.date).toBe('2026-01-01');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].developerName).toBe('Test Dev One');
      expect(result.entries[0].hours).toBe(8);
    });
  });

  describe('getCustomReport', () => {
    it('returns timeline and detail rows for a day period', async () => {
      prisma.worklog.findMany.mockResolvedValue([worklogWithNested]);

      const result = await service.getCustomReport({ period: 'day', startDate: '2026-01-05' });

      expect(result.period).toBe('day');
      expect(result.details).toHaveLength(1);
      expect(result.summary.totalHours).toBe(8);
      expect(result.summary.billableHours).toBe(8);
      expect(result.summary.nonBillableHours).toBe(0);
    });

    it('filters by projectIds when provided', async () => {
      prisma.worklog.findMany.mockResolvedValue([]);

      await service.getCustomReport({ period: 'day', startDate: '2026-01-05', projectIds: [1] });

      const call = prisma.worklog.findMany.mock.calls[0][0] as any;
      expect(call.where.component).toEqual({ projectId: { in: [1] } });
    });

    it('filters by developerEmails when provided', async () => {
      prisma.worklog.findMany.mockResolvedValue([]);

      await service.getCustomReport({
        period: 'day',
        startDate: '2026-01-05',
        developerEmails: ['test.dev1@example.com'],
      });

      const call = prisma.worklog.findMany.mock.calls[0][0] as any;
      expect(call.where.assigned).toEqual({ in: ['test.dev1@example.com'] });
    });
  });
});
