import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WorklogsService } from './worklogs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../../test/helpers/mock-prisma';
import { DUMMY_WORKLOGS, DUMMY_COMPONENTS } from '../../../test/fixtures/dummy-data';

const worklogWithComponent = { ...DUMMY_WORKLOGS[0], component: DUMMY_COMPONENTS[0] };

describe('WorklogsService', () => {
  let service: WorklogsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        WorklogsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(WorklogsService);
  });

  describe('findAll', () => {
    it('returns all worklogs without month filter', async () => {
      prisma.worklog.findMany.mockResolvedValue([worklogWithComponent]);
      const result = await service.findAll();
      expect(result).toEqual([worklogWithComponent]);
      expect(prisma.worklog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
      );
    });

    it('applies month filter when month param provided', async () => {
      prisma.worklog.findMany.mockResolvedValue([worklogWithComponent]);
      await service.findAll('2026-01');
      const call = prisma.worklog.findMany.mock.calls[0][0] as any;
      expect(call.where.date).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('returns worklog when found', async () => {
      prisma.worklog.findUnique.mockResolvedValue(worklogWithComponent);
      const result = await service.findOne(1);
      expect(result).toBe(worklogWithComponent);
    });

    it('throws NotFoundException when not found', async () => {
      prisma.worklog.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a worklog', async () => {
      prisma.worklog.create.mockResolvedValue(worklogWithComponent);
      const input = {
        date: '2026-01-01',
        hours: 8,
        jiraWorklogId: 'test-wl-001',
        ticketKey: 'TEST-1',
        assigned: 'test.dev1@example.com',
        componentId: 1,
      };
      const result = await service.create(input as any);
      expect(result).toBe(worklogWithComponent);
    });
  });

  describe('update', () => {
    it('updates worklog when found', async () => {
      const updated = { ...worklogWithComponent, hours: 6 };
      prisma.worklog.findUnique.mockResolvedValue(worklogWithComponent);
      prisma.worklog.update.mockResolvedValue(updated);
      const result = await service.update(1, { hours: 6 });
      expect(result).toBe(updated);
    });

    it('throws NotFoundException when worklog not found', async () => {
      prisma.worklog.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { hours: 1 })).rejects.toThrow(NotFoundException);
    });
  });
});
