export type MirrorSyncRunRequest = {
  rootDir: string;
  verbose?: boolean;
  noColor?: boolean;
  /** When true, suppress human progress output and print one JSON object on stdout. */
  json?: boolean;
  packageFilter?: string;
  config?: unknown;
};
