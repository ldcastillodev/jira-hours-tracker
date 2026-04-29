import { Test } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { DUMMY_PROJECTS, DUMMY_COMPONENTS } from '../../../test/fixtures/dummy-data';

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  activateProject: jest.fn(),
  activateProjectCascade: jest.fn(),
  findComponents: jest.fn(),
  createComponent: jest.fn(),
  updateComponent: jest.fn(),
  deleteComponent: jest.fn(),
  activateComponent: jest.fn(),
};

describe('ProjectsController', () => {
  let controller: ProjectsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: mockService }],
    }).compile();
    controller = module.get(ProjectsController);
  });

  it('findAll delegates to service', async () => {
    mockService.findAll.mockResolvedValue(DUMMY_PROJECTS);
    expect(await controller.findAll()).toBe(DUMMY_PROJECTS);
  });

  it('create passes DTO to service', async () => {
    const dto = { name: 'Test Project Alpha', monthlyBudget: 100 } as any;
    mockService.create.mockResolvedValue(DUMMY_PROJECTS[0]);
    await controller.create(dto);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('activateProject calls activateProjectCascade when cascade=true', async () => {
    mockService.activateProjectCascade.mockResolvedValue({ projectActivated: true, componentsActivated: 1 });
    await controller.activateProject('1', { cascade: true } as any);
    expect(mockService.activateProjectCascade).toHaveBeenCalledWith(1);
    expect(mockService.activateProject).not.toHaveBeenCalled();
  });

  it('activateProject calls activateProject when cascade is falsy', async () => {
    mockService.activateProject.mockResolvedValue(DUMMY_PROJECTS[0]);
    await controller.activateProject('1', {} as any);
    expect(mockService.activateProject).toHaveBeenCalledWith(1);
  });

  it('createComponent passes projectId and DTO to service', async () => {
    const dto = { name: 'Test Component Alpha', isBillable: true } as any;
    mockService.createComponent.mockResolvedValue(DUMMY_COMPONENTS[0]);
    await controller.createComponent('1', dto);
    expect(mockService.createComponent).toHaveBeenCalledWith(1, dto);
  });

  it('deleteComponent delegates to service', async () => {
    mockService.deleteComponent.mockResolvedValue({ deleted: true });
    await controller.deleteComponent('1');
    expect(mockService.deleteComponent).toHaveBeenCalledWith(1);
  });
});
