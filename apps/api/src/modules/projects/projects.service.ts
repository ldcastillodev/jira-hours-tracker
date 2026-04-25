import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({
      include: { components: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { components: true },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  create(data: { name: string; monthlyBudget: number }) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        monthlyBudget: data.monthlyBudget,
      },
    });
  }

  async update(id: number, data: { name?: string; monthlyBudget?: number }) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        monthlyBudget: data.monthlyBudget,
      },
    });
  }

  async delete(id: number) {
    await this.findOne(id);
    try {
      await this.prisma.project.delete({ where: { id } });
      return { deleted: true };
    } catch (err: any) {
      if (err.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete project with existing components',
        );
      }
      throw err;
    }
  }

  // --- Component CRUD ---

  findComponents(projectId: number) {
    return this.prisma.component.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  createComponent(
    projectId: number,
    data: { name: string; isBillable: boolean },
  ) {
    return this.prisma.component.create({
      data: {
        name: data.name,
        isBillable: data.isBillable,
        projectId,
      },
    });
  }

  async updateComponent(
    id: number,
    data: { name?: string; isBillable?: boolean },
  ) {
    const comp = await this.prisma.component.findUnique({ where: { id } });
    if (!comp) throw new NotFoundException(`Component ${id} not found`);
    return this.prisma.component.update({ where: { id }, data });
  }

  async deleteComponent(id: number) {
    const comp = await this.prisma.component.findUnique({ where: { id } });
    if (!comp) throw new NotFoundException(`Component ${id} not found`);
    try {
      await this.prisma.component.delete({ where: { id } });
      return { deleted: true };
    } catch (err: any) {
      if (err.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete component with existing worklogs',
        );
      }
      throw err;
    }
  }
}
