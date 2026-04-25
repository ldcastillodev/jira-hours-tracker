import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ClientHoursSummaryDto,
  MonthReportDto,
  ClientSummaryDto,
  DailySheetDto,
} from '@mgs/shared';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getClientHours(month?: string): Promise<ClientHoursSummaryDto> {
    const dateFilter = month ? this.buildMonthFilter(month) : {};

    const projects = await this.prisma.project.findMany({
      where: { parentId: null },
      include: {
        worklogs: { where: dateFilter },
        children: {
          include: { worklogs: { where: dateFilter } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const clients = projects.map((project) => {
      const directHours = project.worklogs.reduce(
        (sum, w) => sum + Number(w.hours),
        0,
      );
      const childHours = project.children.reduce(
        (sum, child) =>
          sum + child.worklogs.reduce((s, w) => s + Number(w.hours), 0),
        0,
      );
      const used = directHours + childHours;
      const contracted = Number(project.monthlyBudget ?? 0);
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
      include: { developer: true },
    });

    const devMap = new Map<
      string,
      { name: string; billable: number; nonBillable: number }
    >();

    for (const w of worklogs) {
      const key = w.developerId;
      const entry = devMap.get(key) || {
        name: w.developer.name,
        billable: 0,
        nonBillable: 0,
      };
      if (w.isBillable) {
        entry.billable += Number(w.hours);
      } else {
        entry.nonBillable += Number(w.hours);
      }
      devMap.set(key, entry);
    }

    const developers = Array.from(devMap.entries()).map(([id, d]) => ({
      developerId: id,
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

    // Components = projects with a parentId (children)
    const components = await this.prisma.project.findMany({
      where: { parentId: { not: null } },
      include: {
        parent: true,
        worklogs: { where: dateFilter },
      },
      orderBy: { name: 'asc' },
    });

    return {
      month: resolvedMonth,
      components: components.map((c) => ({
        projectId: c.id,
        projectName: c.name,
        parentProjectName: c.parent?.name ?? null,
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
        developer: true,
        project: true,
      },
      orderBy: [{ developer: { name: 'asc' } }, { project: { name: 'asc' } }],
    });

    return {
      date,
      entries: worklogs.map((w) => ({
        developerId: w.developerId,
        developerName: w.developer.name,
        componentName: w.project.name,
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
}
