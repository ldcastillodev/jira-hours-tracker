import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({
      include: { children: true },
      where: { parentId: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  create(data: { name: string; monthlyBudget?: number; parentId?: string }) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        monthlyBudget: data.monthlyBudget,
        parentId: data.parentId,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; monthlyBudget?: number; parentId?: string | null },
  ) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        monthlyBudget: data.monthlyBudget,
        parentId: data.parentId,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.project.delete({ where: { id } });
      return { deleted: true };
    } catch (err: any) {
      if (err.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete project with existing worklogs or child projects',
        );
      }
      throw err;
    }
  }
}
