export interface ClientHoursDto {
  projectId: number;
  projectName: string;
  contracted: number;
  used: number;
  remaining: number;
  percentUsed: number;
}

export interface ClientHoursSummaryDto {
  totalContracted: number;
  totalUsed: number;
  totalRemaining: number;
  overBudgetCount: number;
  clients: ClientHoursDto[];
}
