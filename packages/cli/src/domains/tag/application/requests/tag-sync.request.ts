export type TagSyncRunRequest = {
  rootDir: string;
  write: boolean;
  /**
   * When true, print one JSON object on stdout and suppress human progress.
   */
  json?: boolean;
  targetPath?: string;
  skipPackages?: string[];
  config?: unknown;
};
