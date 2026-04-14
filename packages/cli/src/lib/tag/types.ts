import type { CodefastTagConfig } from "#lib/config/schema";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";

export type TagFileResult = {
  filePath: string;
  taggedDeclarations: number;
  changed: boolean;
};

export type TagRunResult = {
  version: string;
  filesScanned: number;
  filesChanged: number;
  taggedDeclarations: number;
  fileResults: TagFileResult[];
};

export type TagRunOptions = {
  write: boolean;
};

/** Command-orchestrated tag run: config is injected at the CLI boundary (no filesystem config reads in core). */
export type TagSyncOptions = {
  rootDir: string;
  config?: CodefastTagConfig;
  targetPath: string;
  write: boolean;
  fs?: CliFs;
  logger?: CliLogger;
};
