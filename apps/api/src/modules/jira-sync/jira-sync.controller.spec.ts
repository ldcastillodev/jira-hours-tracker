import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JiraSyncController } from './jira-sync.controller';
import { JiraSyncService } from './jira-sync.service';

const mockService = {
  syncWorklogs: jest.fn(),
};

describe('JiraSyncController', () => {
  let controller: JiraSyncController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [JiraSyncController],
      providers: [{ provide: JiraSyncService, useValue: mockService }],
    }).compile();
    controller = module.get(JiraSyncController);
  });

  it('throws BadRequestException for a future month', async () => {
    // Month 12 is guaranteed to be in the future from any month < 12
    // We inject a month > current month by using a high value that tests the guard
    const now = new Date();
    const futureMonth = now.getMonth() + 2; // always future within the year
    if (futureMonth > 12) return; // skip if we're in December (edge case)

    await expect(controller.triggerSync({ month: futureMonth } as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns skipped response when service returns skipped', async () => {
    mockService.syncWorklogs.mockResolvedValue({ status: 'skipped', message: 'No credentials' });
    const result = await controller.triggerSync({} as any);
    expect(result).toEqual({ success: false, message: 'No credentials' });
  });

  it('returns success response with worklog counts when sync completes', async () => {
    mockService.syncWorklogs.mockResolvedValue({
      status: 'completed',
      inserted: 10,
      updated: 2,
      deleted: 1,
      unchanged: 5,
      skippedCount: 0,
    });

    const result = await controller.triggerSync({} as any) as any;

    expect(result.success).toBe(true);
    expect(result.worklogsCreated).toBe(10);
    expect(result.worklogsUpdated).toBe(2);
    expect(result.worklogsDeleted).toBe(1);
    expect(result.worklogsUnchanged).toBe(5);
    expect(result.message).toContain('removed');
  });

  it('omits removed suffix when no deletions', async () => {
    mockService.syncWorklogs.mockResolvedValue({
      status: 'completed',
      inserted: 3,
      updated: 0,
      deleted: 0,
      unchanged: 0,
      skippedCount: 0,
    });

    const result = await controller.triggerSync({} as any) as any;

    expect(result.message).not.toContain('removed');
  });
});
