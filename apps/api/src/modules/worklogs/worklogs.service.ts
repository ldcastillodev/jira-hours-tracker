import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorklogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(month?: string) {
    const where = month ? this.buildMonthFilter(month) : {};
    return this.prisma.worklog.findMany({
      where,
      include: { project: true, developer: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const worklog = await this.prisma.worklog.findUnique({
      where: { id },
      include: { project: true, developer: true },
    });
    if (!worklog) throw new NotFoundException(`Worklog ${id} not found`);
    return worklog;
  }

  create(data: {
    date: string;
    hours: number;
    isBillable?: boolean;
    projectId: string;
    developerId: string;
    jiraIssueId?: string;
  }) {
    return this.prisma.worklog.create({
      data: {
        date: new Date(data.date),
        hours: data.hours,
        isBillable: data.isBillable ?? true,
        projectId: data.projectId,
        developerId: data.developerId,
        jiraIssueId: data.jiraIssueId,
      },
    });
  }

  async update(
    id: string,
    data: {
      date?: string;
      hours?: number;
      isBillable?: boolean;
      projectId?: string;
      developerId?: string;
    },
  ) {
    await this.findOne(id);
    return this.prisma.worklog.update({
      where: { id },
      data: {
        ...(data.date && { date: new Date(data.date) }),
        ...(data.hours !== undefined && { hours: data.hours }),
        ...(data.isBillable !== undefined && { isBillable: data.isBillable }),
        ...(data.projectId && { projectId: data.projectId }),
        ...(data.developerId && { developerId: data.developerId }),
      },
    });
  }

  private buildMonthFilter(month: string) {
    const [year, m] = month.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    return { date: { gte: start, lt: end } };
  }
}
