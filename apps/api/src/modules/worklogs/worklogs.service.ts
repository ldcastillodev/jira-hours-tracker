import { Injectable } from '@nestjs/common';
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

  private buildMonthFilter(month: string) {
    const [year, m] = month.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    return { date: { gte: start, lt: end } };
  }
}
