import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../../test/helpers/mock-prisma';
import { DUMMY_PROJECTS, DUMMY_COMPONENTS } from '../../../test/fixtures/dummy-data';

const projectWithComponents = {
  ...DUMMY_PROJECTS[0],
  components: [DUMMY_COMPONENTS[0]],
};

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ProjectsService);
  });

  describe('findAll', () => {
    it('returns active projects with components', async () => {
      prisma.project.findMany.mockResolvedValue([projectWithComponents]);
      const result = await service.findAll();
      expect(result).toEqual([projectWithComponents]);
    });
  });

  describe('findOne', () => {
    it('returns project when found', async () => {
      prisma.project.findFirst.mockResolvedValue(projectWithComponents);
      const result = await service.findOne(1);
      expect(result).toBe(projectWithComponents);
    });

    it('throws NotFoundException when not found', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns a project', async () => {
      prisma.project.create.mockResolvedValue(DUMMY_PROJECTS[0]);
      const result = await service.create({ name: 'Test Project Alpha', monthlyBudget: 100 });
      expect(result).toBe(DUMMY_PROJECTS[0]);
    });
  });

  describe('update', () => {
    it('updates a project when found', async () => {
      const updated = { ...DUMMY_PROJECTS[0], name: 'Updated' };
      prisma.project.findFirst.mockResolvedValue(projectWithComponents);
      prisma.project.update.mockResolvedValue(updated);
      const result = await service.update(1, { name: 'Updated' });
      expect(result).toBe(updated);
    });

    it('throws NotFoundException when project not found', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('soft-deletes project and its active components', async () => {
      prisma.project.findFirst.mockResolvedValue(projectWithComponents);
      prisma.project.update.mockResolvedValue({ ...DUMMY_PROJECTS[0], deletedAt: new Date() });
      prisma.component.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.delete(1);
      expect(result).toEqual({ deleted: true });
      expect(prisma.component.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ projectId: 1 }) }),
      );
    });
  });

  describe('activateProject', () => {
    const inactive = { ...DUMMY_PROJECTS[0], deletedAt: new Date('2026-01-01') };

    it('activates project when no name conflict', async () => {
      prisma.project.findFirst
        .mockResolvedValueOnce(inactive)
        .mockResolvedValueOnce(null);
      prisma.project.update.mockResolvedValue({ ...inactive, deletedAt: null });
      await expect(service.activateProject(1)).resolves.toBeDefined();
    });

    it('throws NotFoundException when inactive project not found', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(service.activateProject(999)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when project name already exists', async () => {
      prisma.project.findFirst
        .mockResolvedValueOnce(inactive)
        .mockResolvedValueOnce(DUMMY_PROJECTS[1]);
      await expect(service.activateProject(1)).rejects.toThrow(ConflictException);
    });
  });

  describe('activateProjectCascade', () => {
    const inactiveComp = { ...DUMMY_COMPONENTS[0], deletedAt: new Date('2026-01-01') };
    const inactiveProject = { ...DUMMY_PROJECTS[0], deletedAt: new Date('2026-01-01'), components: [inactiveComp] };

    it('activates project and its inactive components', async () => {
      prisma.project.findFirst
        .mockResolvedValueOnce(inactiveProject)
        .mockResolvedValueOnce(null); // no project name conflict
      prisma.component.findFirst.mockResolvedValue(null); // no component name conflict
      prisma.project.update.mockResolvedValue({ ...inactiveProject, deletedAt: null });
      prisma.component.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.activateProjectCascade(1);
      expect(result).toEqual({ projectActivated: true, componentsActivated: 1 });
    });

    it('throws ConflictException when a component name already exists', async () => {
      prisma.project.findFirst
        .mockResolvedValueOnce(inactiveProject)
        .mockResolvedValueOnce(null);
      prisma.component.findFirst.mockResolvedValue(DUMMY_COMPONENTS[1]); // conflict
      await expect(service.activateProjectCascade(1)).rejects.toThrow(ConflictException);
    });
  });

  describe('createComponent', () => {
    it('creates component when project has no existing active component', async () => {
      prisma.component.findFirst
        .mockResolvedValueOnce(null) // no existing for project
        .mockResolvedValueOnce(null); // no name conflict
      prisma.component.create.mockResolvedValue(DUMMY_COMPONENTS[0]);
      const result = await service.createComponent(1, { name: 'Test Component Alpha', isBillable: true });
      expect(result).toBe(DUMMY_COMPONENTS[0]);
    });

    it('throws ConflictException when project already has an active component', async () => {
      prisma.component.findFirst.mockResolvedValue(DUMMY_COMPONENTS[0]);
      await expect(
        service.createComponent(1, { name: 'Another', isBillable: true }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when component name already exists globally', async () => {
      prisma.component.findFirst
        .mockResolvedValueOnce(null) // no existing for project
        .mockResolvedValueOnce(DUMMY_COMPONENTS[1]); // name conflict
      await expect(
        service.createComponent(1, { name: 'Test Component Beta', isBillable: true }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateComponent', () => {
    it('updates component when found and no name conflict', async () => {
      const updated = { ...DUMMY_COMPONENTS[0], name: 'Updated Component' };
      prisma.component.findFirst
        .mockResolvedValueOnce(DUMMY_COMPONENTS[0]) // found
        .mockResolvedValueOnce(null); // no conflict
      prisma.component.update.mockResolvedValue(updated);
      const result = await service.updateComponent(1, { name: 'Updated Component' });
      expect(result).toBe(updated);
    });

    it('throws NotFoundException when component not found', async () => {
      prisma.component.findFirst.mockResolvedValue(null);
      await expect(service.updateComponent(999, { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteComponent', () => {
    it('soft-deletes component and its project', async () => {
      prisma.component.findFirst.mockResolvedValue(DUMMY_COMPONENTS[0]);
      prisma.component.update.mockResolvedValue({ ...DUMMY_COMPONENTS[0], deletedAt: new Date() });
      prisma.project.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.deleteComponent(1);
      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException when component not found', async () => {
      prisma.component.findFirst.mockResolvedValue(null);
      await expect(service.deleteComponent(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('activateComponent', () => {
    const inactive = { ...DUMMY_COMPONENTS[0], deletedAt: new Date('2026-01-01') };

    it('activates component when no name conflict', async () => {
      prisma.component.findFirst
        .mockResolvedValueOnce(inactive)
        .mockResolvedValueOnce(null);
      prisma.component.update.mockResolvedValue({ ...inactive, deletedAt: null });
      await expect(service.activateComponent(1)).resolves.toBeDefined();
    });

    it('throws ConflictException when component name already exists', async () => {
      prisma.component.findFirst
        .mockResolvedValueOnce(inactive)
        .mockResolvedValueOnce(DUMMY_COMPONENTS[1]);
      await expect(service.activateComponent(1)).rejects.toThrow(ConflictException);
    });
  });
});
