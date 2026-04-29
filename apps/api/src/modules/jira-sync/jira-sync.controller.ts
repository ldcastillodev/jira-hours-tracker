import { BadRequestException, Controller, Post, Query } from '@nestjs/common';
import { JiraSyncService } from './jira-sync.service';

@Controller('jira-sync')
export class JiraSyncController {
  constructor(private readonly jiraSyncService: JiraSyncService) {}

  @Post('trigger')
  async triggerSync(@Query('month') monthParam?: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const month = monthParam !== undefined ? parseInt(monthParam, 10) : currentMonth;

    if (isNaN(month) || month < 1 || month > 12) {
      throw new BadRequestException('month must be between 1 and 12');
    }
    if (month > currentMonth) {
      throw new BadRequestException('Cannot sync future months');
    }

    const startDate = `${currentYear}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, month, 0).getDate();
    const endDate = `${currentYear}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const result = await this.jiraSyncService.syncWorklogs(startDate, endDate);

    if (result.status === 'skipped') {
      return { success: false, message: result.message };
    }

    const monthName = new Date(currentYear, month - 1, 1).toLocaleString('en-US', { month: 'long' });
    const synced = result.inserted + result.updated;
    const parts = [`Synced ${synced} changes from ${monthName} ${currentYear}`];
    if (result.deleted > 0) parts.push(`${result.deleted} removed`);

    return {
      success: true,
      message: parts.join(' · '),
      month,
      year: currentYear,
      worklogsSynced: synced,
      worklogsCreated: result.inserted,
      worklogsUpdated: result.updated,
      worklogsDeleted: result.deleted,
      worklogsUnchanged: result.unchanged,
      skipped: result.skippedCount,
    };
  }
}
