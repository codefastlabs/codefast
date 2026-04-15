export type TagSyncRunRequest = {
  rootDir: string;
  write: boolean;
  targetPath?: string;
  skipPackages?: string[];
  config?: unknown;
};
