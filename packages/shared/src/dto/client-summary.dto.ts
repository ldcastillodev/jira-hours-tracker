export interface ComponentSummaryDto {
  projectId: string;
  projectName: string;
  parentProjectName: string | null;
  totalHours: number;
}

export interface ClientSummaryDto {
  month: string; // YYYY-MM
  components: ComponentSummaryDto[];
}
