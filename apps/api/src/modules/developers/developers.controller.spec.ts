import { Test } from '@nestjs/testing';
import { DevelopersController } from './developers.controller';
import { DevelopersService } from './developers.service';
import { DUMMY_DEVELOPERS } from '../../../test/fixtures/dummy-data';

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  activateDeveloper: jest.fn(),
};

describe('DevelopersController', () => {
  let controller: DevelopersController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [DevelopersController],
      providers: [{ provide: DevelopersService, useValue: mockService }],
    }).compile();
    controller = module.get(DevelopersController);
  });

  it('findAll delegates to service', async () => {
    mockService.findAll.mockResolvedValue(DUMMY_DEVELOPERS);
    expect(await controller.findAll()).toBe(DUMMY_DEVELOPERS);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('findOne passes numeric id to service', async () => {
    mockService.findOne.mockResolvedValue(DUMMY_DEVELOPERS[0]);
    await controller.findOne('1');
    expect(mockService.findOne).toHaveBeenCalledWith(1);
  });

  it('create passes DTO to service', async () => {
    const dto = { name: 'Test Dev One', email: 'test.dev1@example.com' } as any;
    mockService.create.mockResolvedValue(DUMMY_DEVELOPERS[0]);
    await controller.create(dto);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('update passes numeric id and DTO to service', async () => {
    const dto = { name: 'Updated' } as any;
    mockService.update.mockResolvedValue(DUMMY_DEVELOPERS[0]);
    await controller.update('1', dto);
    expect(mockService.update).toHaveBeenCalledWith(1, dto);
  });

  it('remove delegates delete to service', async () => {
    mockService.delete.mockResolvedValue({ deleted: true });
    await controller.remove('1');
    expect(mockService.delete).toHaveBeenCalledWith(1);
  });

  it('activate delegates to activateDeveloper', async () => {
    mockService.activateDeveloper.mockResolvedValue(DUMMY_DEVELOPERS[0]);
    await controller.activate('1');
    expect(mockService.activateDeveloper).toHaveBeenCalledWith(1);
  });
});
