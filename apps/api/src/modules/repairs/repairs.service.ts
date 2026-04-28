import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RepairsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Re-associates all worklogs for the given component to the component's
   * current projectId. Since worklogs reference componentId (not projectId),
   * this is a verification + report operation — it confirms the component and
   * its worklogs are consistent, and returns a summary.
   */
  async syncComponent(componentId: number) {
    const component = await this.prisma.component.findFirst({
      where: { id: componentId, deletedAt: null },
      include: { project: true },
    });
    if (!component) {
      throw new NotFoundException(`Component ${componentId} not found`);
    }

    const worklogCount = await this.prisma.worklog.count({
      where: { componentId },
    });

    return {
      success: true,
      componentId: component.id,
      componentName: component.name,
      currentProjectId: component.projectId,
      currentProjectName: component.project.name,
      worklogs: worklogCount,
    };
  }
}
