import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DevelopersService } from './developers.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../../test/helpers/mock-prisma';
import { DUMMY_DEVELOPERS } from '../../../test/fixtures/dummy-data';

describe('DevelopersService', () => {
  let service: DevelopersService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        DevelopersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(DevelopersService);
  });

  describe('findAll', () => {
    it('returns active developers', async () => {
      prisma.developer.findMany.mockResolvedValue(DUMMY_DEVELOPERS);
      const result = await service.findAll();
      expect(result).toBe(DUMMY_DEVELOPERS);
      expect(prisma.developer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns developer when found', async () => {
      prisma.developer.findFirst.mockResolvedValue(DUMMY_DEVELOPERS[0]);
      const result = await service.findOne(1);
      expect(result).toBe(DUMMY_DEVELOPERS[0]);
    });

    it('throws NotFoundException when not found', async () => {
      prisma.developer.findFirst.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns a developer', async () => {
      const input = { name: 'Test Dev One', email: 'test.dev1@example.com' };
      prisma.developer.create.mockResolvedValue(DUMMY_DEVELOPERS[0]);
      const result = await service.create(input as any);
      expect(result).toBe(DUMMY_DEVELOPERS[0]);
      expect(prisma.developer.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('update', () => {
    it('updates and returns developer when found', async () => {
      const updated = { ...DUMMY_DEVELOPERS[0], name: 'Updated Name' };
      prisma.developer.findFirst.mockResolvedValue(DUMMY_DEVELOPERS[0]);
      prisma.developer.update.mockResolvedValue(updated);
      const result = await service.update(1, { name: 'Updated Name' });
      expect(result).toBe(updated);
    });

    it('throws NotFoundException when developer not found', async () => {
      prisma.developer.findFirst.mockResolvedValue(null);
      await expect(service.update(999, { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('soft-deletes developer and returns { deleted: true }', async () => {
      prisma.developer.findFirst.mockResolvedValue(DUMMY_DEVELOPERS[0]);
      prisma.developer.update.mockResolvedValue({ ...DUMMY_DEVELOPERS[0], deletedAt: new Date() });
      const result = await service.delete(1);
      expect(result).toEqual({ deleted: true });
      expect(prisma.developer.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
    });

    it('throws NotFoundException when developer not found', async () => {
      prisma.developer.findFirst.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('activateDeveloper', () => {
    const inactive = { ...DUMMY_DEVELOPERS[0], deletedAt: new Date('2026-01-01') };

    it('activates developer when no email conflict', async () => {
      prisma.developer.findFirst
        .mockResolvedValueOnce(inactive)
        .mockResolvedValueOnce(null);
      prisma.developer.update.mockResolvedValue({ ...inactive, deletedAt: null });
      const result = await service.activateDeveloper(1);
      expect((result as any).deletedAt).toBeNull();
    });

    it('throws NotFoundException when inactive developer not found', async () => {
      prisma.developer.findFirst.mockResolvedValue(null);
      await expect(service.activateDeveloper(999)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when email already taken by active developer', async () => {
      prisma.developer.findFirst
        .mockResolvedValueOnce(inactive)
        .mockResolvedValueOnce(DUMMY_DEVELOPERS[1]);
      await expect(service.activateDeveloper(1)).rejects.toThrow(ConflictException);
    });
  });
});
