export interface DailyEntryDto {
  developerName: string;
  componentName: string;
  hours: number;
}

export interface DailySheetDto {
  date: string; // YYYY-MM-DD
  entries: DailyEntryDto[];
}
