export interface DeveloperWorkloadDto {
  developerId: number;
  developerName: string;
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
}

export interface MonthReportDto {
  month: string; // YYYY-MM
  developers: DeveloperWorkloadDto[];
  totalBillable: number;
  totalNonBillable: number;
  totalHours: number;
}
