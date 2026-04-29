import { Test } from '@nestjs/testing';
import { InactiveService } from './inactive.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../../test/helpers/mock-prisma';
import {
  DUMMY_PROJECTS,
  DUMMY_COMPONENTS,
  DUMMY_DEVELOPERS,
} from '../../../test/fixtures/dummy-data';

describe('InactiveService', () => {
  let service: InactiveService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [InactiveService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(InactiveService);
  });

  describe('findAll', () => {
    it('returns aggregated soft-deleted projects, components and developers', async () => {
      const inactiveProject = { ...DUMMY_PROJECTS[0], deletedAt: new Date(), components: [] };
      const inactiveComponent = {
        ...DUMMY_COMPONENTS[0],
        deletedAt: new Date(),
        project: DUMMY_PROJECTS[0],
      };
      const inactiveDev = { ...DUMMY_DEVELOPERS[0], deletedAt: new Date() };

      prisma.project.findMany.mockResolvedValue([inactiveProject]);
      prisma.component.findMany.mockResolvedValue([inactiveComponent]);
      prisma.developer.findMany.mockResolvedValue([inactiveDev]);

      const result = await service.findAll();

      expect(result.projects).toEqual([inactiveProject]);
      expect(result.components).toEqual([inactiveComponent]);
      expect(result.developers).toEqual([inactiveDev]);
    });
  });
});
