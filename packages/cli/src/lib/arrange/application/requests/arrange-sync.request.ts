export type ArrangeSyncRunRequest = {
  rootDir: string;
  targetPath: string;
  write: boolean;
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
