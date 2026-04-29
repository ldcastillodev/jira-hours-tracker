import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InactiveService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const [projects, components, developers] = await Promise.all([
      this.prisma.project.findMany({
        where: { deletedAt: { not: null } },
        include: { components: true },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.component.findMany({
        where: { deletedAt: { not: null } },
        include: { project: true },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.developer.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
    ]);
    return { projects, components, developers };
  }
}
