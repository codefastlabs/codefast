export type ArrangeSyncRunRequest = {
  rootDir: string;
  targetPath: string;
  write: boolean;
  /** When true, print one JSON object on stdout and suppress human progress. */
  json?: boolean;
  withClassName?: boolean;
  cnImport?: string;
  config?: unknown;
};

export type ArrangeRunTargetRequest = {
  targetPath: string;
  write: boolean;
  withClassName?: boolean;
  cnImport?: string;
};
