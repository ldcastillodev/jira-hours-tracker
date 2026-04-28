import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({
      where: { deletedAt: null },
      include: { components: { where: { deletedAt: null } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: { components: { where: { deletedAt: null } } },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  create(data: { name: string; monthlyBudget: number }) {
    return this.prisma.project.create({
      data: { name: data.name, monthlyBudget: data.monthlyBudget },
    });
  }

  async update(id: number, data: { name?: string; monthlyBudget?: number }) {
    await this.findOne(id);
    return this.prisma.project.update({ where: { id }, data });
  }

  async delete(id: number) {
    await this.findOne(id);
    const now = new Date();
    await this.prisma.project.update({ where: { id }, data: { deletedAt: now } });
    // Cascade: soft-delete the active component for this project (if any)
    await this.prisma.component.updateMany({
      where: { projectId: id, deletedAt: null },
      data: { deletedAt: now },
    });
    return { deleted: true };
  }

  // --- Trash: list all soft-deleted projects ---
  findDeleted() {
    return this.prisma.project.findMany({
      where: { deletedAt: { not: null } },
      include: { components: true },
      orderBy: { deletedAt: 'desc' },
    });
  }

  // --- Restore ---

  async restoreProject(id: number) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!project) throw new NotFoundException(`Deleted project ${id} not found`);
    const conflict = await this.prisma.project.findFirst({
      where: { name: project.name, deletedAt: null, id: { not: id } },
    });
    if (conflict)
      throw new ConflictException(
        `A project named "${project.name}" already exists. Rename it before restoring.`,
      );
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async restoreProjectCascade(id: number) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: { not: null } },
      include: { components: { where: { deletedAt: { not: null } } } },
    });
    if (!project) throw new NotFoundException(`Deleted project ${id} not found`);
    const conflict = await this.prisma.project.findFirst({
      where: { name: project.name, deletedAt: null, id: { not: id } },
    });
    if (conflict)
      throw new ConflictException(
        `A project named "${project.name}" already exists. Rename it before restoring.`,
      );
    // Check component name conflicts
    for (const comp of project.components) {
      const compConflict = await this.prisma.component.findFirst({
        where: { name: comp.name, deletedAt: null },
      });
      if (compConflict)
        throw new ConflictException(
          `A component named "${comp.name}" already exists. Rename it before restoring.`,
        );
    }
    await this.prisma.project.update({ where: { id }, data: { deletedAt: null } });
    const { count } = await this.prisma.component.updateMany({
      where: { projectId: id, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    return { projectRestored: true, componentsRestored: count };
  }

  // --- Component CRUD ---

  findComponents(projectId: number) {
    return this.prisma.component.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  // Soft-deleted components for trash view
  findDeletedComponents() {
    return this.prisma.component.findMany({
      where: { deletedAt: { not: null } },
      include: { project: true },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async createComponent(projectId: number, data: { name: string; isBillable: boolean }) {
    // 1:1 enforcement — project may only have one active component
    const existingForProject = await this.prisma.component.findFirst({
      where: { projectId, deletedAt: null },
    });
    if (existingForProject)
      throw new ConflictException(
        `Project already has component "${existingForProject.name}". Remove it first.`,
      );

    const conflict = await this.prisma.component.findFirst({
      where: { name: data.name, deletedAt: null },
    });
    if (conflict)
      throw new ConflictException(`A component named "${data.name}" already exists.`);
    return this.prisma.component.create({
      data: { name: data.name, isBillable: data.isBillable, projectId },
    });
  }

  async updateComponent(id: number, data: { name?: string; isBillable?: boolean }) {
    const comp = await this.prisma.component.findFirst({ where: { id, deletedAt: null } });
    if (!comp) throw new NotFoundException(`Component ${id} not found`);
    if (data.name && data.name !== comp.name) {
      const conflict = await this.prisma.component.findFirst({
        where: { name: data.name, deletedAt: null, id: { not: id } },
      });
      if (conflict)
        throw new ConflictException(`A component named "${data.name}" already exists.`);
    }
    return this.prisma.component.update({ where: { id }, data });
  }

  async deleteComponent(id: number) {
    const comp = await this.prisma.component.findFirst({ where: { id, deletedAt: null } });
    if (!comp) throw new NotFoundException(`Component ${id} not found`);
    const now = new Date();
    await this.prisma.component.update({ where: { id }, data: { deletedAt: now } });
    // Cascade: soft-delete the project if it is still active
    await this.prisma.project.updateMany({
      where: { id: comp.projectId, deletedAt: null },
      data: { deletedAt: now },
    });
    return { deleted: true };
  }

  async restoreComponent(id: number) {
    const comp = await this.prisma.component.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!comp) throw new NotFoundException(`Deleted component ${id} not found`);
    const conflict = await this.prisma.component.findFirst({
      where: { name: comp.name, deletedAt: null },
    });
    if (conflict)
      throw new ConflictException(
        `A component named "${comp.name}" already exists. Rename it before restoring.`,
      );
    return this.prisma.component.update({ where: { id }, data: { deletedAt: null } });
  }
}
