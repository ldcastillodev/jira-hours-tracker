import { Test } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

const mockService = {
  getClientHours: jest.fn(),
  getDeveloperWorkload: jest.fn(),
  getClientSummary: jest.fn(),
  getDailySheet: jest.fn(),
  getCustomReport: jest.fn(),
};

describe('ReportsController', () => {
  let controller: ReportsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockService }],
    }).compile();
    controller = module.get(ReportsController);
  });

  it('getClientHours passes month to service', async () => {
    mockService.getClientHours.mockResolvedValue({});
    await controller.getClientHours({ month: '2026-01' });
    expect(mockService.getClientHours).toHaveBeenCalledWith('2026-01');
  });

  it('getClientHours passes undefined when no month', async () => {
    mockService.getClientHours.mockResolvedValue({});
    await controller.getClientHours({});
    expect(mockService.getClientHours).toHaveBeenCalledWith(undefined);
  });

  it('getDailySheet passes date to service', async () => {
    mockService.getDailySheet.mockResolvedValue({});
    await controller.getDailySheet({ date: '2026-01-05' });
    expect(mockService.getDailySheet).toHaveBeenCalledWith('2026-01-05');
  });

  it('getCustomReport passes full query DTO to service', async () => {
    mockService.getCustomReport.mockResolvedValue({});
    const query = { period: 'day' as const, startDate: '2026-01-05', projectIds: [1, 2] };
    await controller.getCustomReport(query as any);
    expect(mockService.getCustomReport).toHaveBeenCalledWith(query);
  });
});
