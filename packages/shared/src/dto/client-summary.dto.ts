export interface ComponentSummaryDto {
  componentId: number;
  componentName: string;
  projectName: string;
  isBillable: boolean;
  totalHours: number;
}

export interface ClientSummaryDto {
  month: string; // YYYY-MM
  components: ComponentSummaryDto[];
}
