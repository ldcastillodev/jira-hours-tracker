import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RepairsService } from './repairs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../../test/helpers/mock-prisma';
import { DUMMY_COMPONENTS, DUMMY_PROJECTS } from '../../../test/fixtures/dummy-data';

describe('RepairsService', () => {
  let service: RepairsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        RepairsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(RepairsService);
  });

  describe('syncComponent', () => {
    it('returns component summary when found', async () => {
      const componentWithProject = { ...DUMMY_COMPONENTS[0], project: DUMMY_PROJECTS[0] };
      prisma.component.findFirst.mockResolvedValue(componentWithProject);
      prisma.worklog.count.mockResolvedValue(4);

      const result = await service.syncComponent(1);

      expect(result).toEqual({
        success: true,
        componentId: 1,
        componentName: 'Test Component Alpha',
        currentProjectId: 1,
        currentProjectName: 'Test Project Alpha',
        worklogs: 4,
      });
    });

    it('throws NotFoundException when component not found', async () => {
      prisma.component.findFirst.mockResolvedValue(null);
      await expect(service.syncComponent(999)).rejects.toThrow(NotFoundException);
    });
  });
});
