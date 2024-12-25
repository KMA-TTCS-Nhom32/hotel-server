export type CleanupConfig = {
  retentionPeriod: number;
  models: string[];
  scheduleTime: string;
  batchSize: number;
  enabled: boolean;
};
