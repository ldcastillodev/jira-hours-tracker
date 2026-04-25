export interface ClientHoursDto {
  projectId: string;
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
