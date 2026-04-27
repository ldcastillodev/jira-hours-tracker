export interface CustomReportTimelineEntryDto {
  date: string;
  billableHours: number;
  nonBillableHours: number;
}

export interface CustomReportDetailDto {
  date: string;
  developer: string;
  project: string;
  component: string;
  ticketKey: string;
  jiraWorklogId: string;
  hours: number;
  billable: boolean;
}

export interface CustomReportDto {
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  filters: {
    projectIds: number[];
    developerEmails: string[];
  };
  summary: {
    totalHours: number;
    billableHours: number;
    nonBillableHours: number;
    worklogs: number;
  };
  timeline: CustomReportTimelineEntryDto[];
  details: CustomReportDetailDto[];
}
