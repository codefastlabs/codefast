export type MirrorSyncRunRequest = {
  rootDir: string;
  verbose?: boolean;
  noColor?: boolean;
  packageFilter?: string;
  config?: unknown;
};
