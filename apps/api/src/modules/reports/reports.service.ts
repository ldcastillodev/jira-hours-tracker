import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ClientHoursSummaryDto,
  MonthReportDto,
  ClientSummaryDto,
  DailySheetDto,
  CustomReportDto,
} from '@mgs/shared';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getClientHours(month?: string): Promise<ClientHoursSummaryDto> {
    const dateFilter = month ? this.buildMonthFilter(month) : {};

    const projects = await this.prisma.project.findMany({
      include: {
        components: {
          include: { worklogs: { where: dateFilter } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const clients = projects.map((project) => {
      const used = project.components.reduce(
        (sum, comp) =>
          sum + comp.worklogs.reduce((s, w) => s + Number(w.hours), 0),
        0,
      );
      const contracted = Number(project.monthlyBudget);
      const remaining = contracted - used;
      const percentUsed = contracted > 0 ? (used / contracted) * 100 : 0;

      return {
        projectId: project.id,
        projectName: project.name,
        contracted,
        used,
        remaining,
        percentUsed: Math.round(percentUsed * 100) / 100,
      };
    });

    const totalContracted = clients.reduce((s, c) => s + c.contracted, 0);
    const totalUsed = clients.reduce((s, c) => s + c.used, 0);
    const totalRemaining = clients
      .filter((c) => c.remaining >= 0)
      .reduce((s, c) => s + c.remaining, 0);
    const overBudgetCount = clients.filter((c) => c.remaining < 0).length;

    return { totalContracted, totalUsed, totalRemaining, overBudgetCount, clients };
  }

  async getDeveloperWorkload(month?: string): Promise<MonthReportDto> {
    const dateFilter = month ? this.buildMonthFilter(month) : {};
    const resolvedMonth = month || this.currentMonth();

    const worklogs = await this.prisma.worklog.findMany({
      where: dateFilter,
      include: { component: true },
    });

    // Build a map of email -> developer name
    const allDevs = await this.prisma.developer.findMany();
    const devNameMap = new Map(allDevs.map((d) => [d.email, d.name]));

    const devMap = new Map<
      string,
      { name: string; billable: number; nonBillable: number }
    >();

    for (const w of worklogs) {
      const key = w.assigned;
      const entry = devMap.get(key) || {
        name: devNameMap.get(key) || key,
        billable: 0,
        nonBillable: 0,
      };
      if (w.component.isBillable) {
        entry.billable += Number(w.hours);
      } else {
        entry.nonBillable += Number(w.hours);
      }
      devMap.set(key, entry);
    }

    // Resolve developer IDs
    const devIdMap = new Map(allDevs.map((d) => [d.email, d.id]));

    const developers = Array.from(devMap.entries()).map(([emailKey, d]) => ({
      developerId: devIdMap.get(emailKey) ?? 0,
      developerName: d.name,
      billableHours: d.billable,
      nonBillableHours: d.nonBillable,
      totalHours: d.billable + d.nonBillable,
    }));

    return {
      month: resolvedMonth,
      developers,
      totalBillable: developers.reduce((s, d) => s + d.billableHours, 0),
      totalNonBillable: developers.reduce((s, d) => s + d.nonBillableHours, 0),
      totalHours: developers.reduce((s, d) => s + d.totalHours, 0),
    };
  }

  async getClientSummary(month?: string): Promise<ClientSummaryDto> {
    const dateFilter = month ? this.buildMonthFilter(month) : {};
    const resolvedMonth = month || this.currentMonth();

    const components = await this.prisma.component.findMany({
      include: {
        project: true,
        worklogs: { where: dateFilter },
      },
      orderBy: { name: 'asc' },
    });

    return {
      month: resolvedMonth,
      components: components.map((c) => ({
        componentId: c.id,
        componentName: c.name,
        projectName: c.project.name,
        isBillable: c.isBillable,
        totalHours: c.worklogs.reduce((sum, w) => sum + Number(w.hours), 0),
      })),
    };
  }

  async getDailySheet(date: string): Promise<DailySheetDto> {
    const day = new Date(date);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const worklogs = await this.prisma.worklog.findMany({
      where: {
        date: { gte: day, lt: nextDay },
      },
      include: {
        component: true,
      },
      orderBy: [{ assigned: 'asc' }, { component: { name: 'asc' } }],
    });

    // Resolve developer names from assigned email
    const allDevs = await this.prisma.developer.findMany();
    const devNameMap = new Map(allDevs.map((d) => [d.email, d.name]));

    return {
      date,
      entries: worklogs.map((w) => ({
        developerName: devNameMap.get(w.assigned) || w.assigned,
        componentName: w.component.name,
        hours: Number(w.hours),
      })),
    };
  }

  private buildMonthFilter(month: string) {
    const [year, m] = month.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    return { date: { gte: start, lt: end } };
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async getCustomReport(params: {
    period: 'day' | 'week' | 'month';
    startDate: string;
    projectIds?: number[];
    developerEmails?: string[];
  }): Promise<CustomReportDto> {
    const { period, startDate, projectIds, developerEmails } = params;
    const { start, end } = this.computeDateRange(period, startDate);

    // Build Prisma where clause
    const where: Record<string, unknown> = {
      date: { gte: start, lt: end },
    };
    if (projectIds && projectIds.length > 0) {
      where.component = { projectId: { in: projectIds } };
    }
    if (developerEmails && developerEmails.length > 0) {
      where.assigned = { in: developerEmails };
    }

    const worklogs = await this.prisma.worklog.findMany({
      where,
      include: { component: { include: { project: true } } },
      orderBy: { date: 'asc' },
    });

    // Build timeline buckets (one per day in range, zero-filled)
    const buckets = new Map<string, { billable: number; nonBillable: number }>();
    const cursor = new Date(start);
    while (cursor < end) {
      const key = cursor.toISOString().slice(0, 10);
      buckets.set(key, { billable: 0, nonBillable: 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    let totalBillable = 0;
    let totalNonBillable = 0;

    const details = worklogs.map((w) => {
      const hours = Number(w.hours);
      const billable = w.component.isBillable;
      const dateKey = (w.date as Date).toISOString().slice(0, 10);
      const bucket = buckets.get(dateKey) ?? { billable: 0, nonBillable: 0 };
      if (billable) {
        bucket.billable += hours;
        totalBillable += hours;
      } else {
        bucket.nonBillable += hours;
        totalNonBillable += hours;
      }
      buckets.set(dateKey, bucket);

      return {
        date: dateKey,
        developer: w.assigned,
        project: w.component.project.name,
        component: w.component.name,
        ticketKey: w.ticketKey,
        jiraWorklogId: w.jiraWorklogId,
        hours,
        billable,
      };
    });

    const timeline = Array.from(buckets.entries()).map(([date, b]) => ({
      date,
      billableHours: Math.round(b.billable * 100) / 100,
      nonBillableHours: Math.round(b.nonBillable * 100) / 100,
    }));

    return {
      period,
      startDate: start.toISOString().slice(0, 10),
      endDate: new Date(end.getTime() - 1).toISOString().slice(0, 10),
      filters: {
        projectIds: projectIds ?? [],
        developerEmails: developerEmails ?? [],
      },
      summary: {
        totalHours: Math.round((totalBillable + totalNonBillable) * 100) / 100,
        billableHours: Math.round(totalBillable * 100) / 100,
        nonBillableHours: Math.round(totalNonBillable * 100) / 100,
        worklogs: worklogs.length,
      },
      timeline,
      details,
    };
  }

  private computeDateRange(
    period: 'day' | 'week' | 'month',
    startDate: string,
  ): { start: Date; end: Date } {
    const ref = new Date(`${startDate}T00:00:00Z`);
    if (period === 'day') {
      const end = new Date(ref);
      end.setUTCDate(end.getUTCDate() + 1);
      return { start: ref, end };
    }
    if (period === 'week') {
      // Monday of the week containing ref
      const dow = ref.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
      const diffToMonday = (dow === 0 ? -6 : 1 - dow);
      const start = new Date(ref);
      start.setUTCDate(start.getUTCDate() + diffToMonday);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 7);
      return { start, end };
    }
    // month
    const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
    const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1));
    return { start, end };
  }
}
