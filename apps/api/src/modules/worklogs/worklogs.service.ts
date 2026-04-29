import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';

@Injectable()
export class WorklogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(month?: string) {
    const where = month ? this.buildMonthFilter(month) : {};
    return this.prisma.worklog.findMany({
      where: { ...where, deletedAt: null },
      include: { component: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const worklog = await this.prisma.worklog.findUnique({
      where: { id },
      include: { component: true },
    });
    if (!worklog) throw new NotFoundException(`Worklog ${id} not found`);
    return worklog;
  }

  create(data: CreateWorklogDto) {
    return this.prisma.worklog.create({
      data: {
        date: new Date(data.date),
        hours: data.hours,
        jiraWorklogId: data.jiraWorklogId,
        ticketKey: data.ticketKey,
        assigned: data.assigned,
        componentId: data.componentId,
      },
    });
  }

  async update(id: number, data: UpdateWorklogDto) {
    await this.findOne(id);
    return this.prisma.worklog.update({
      where: { id },
      data: {
        ...(data.date && { date: new Date(data.date) }),
        ...(data.hours !== undefined && { hours: data.hours }),
        ...(data.componentId !== undefined && { componentId: data.componentId }),
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
