import type { CodefastTagConfig } from "#lib/config";
import type { CliFs } from "#lib/infra/fs-contract";

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

export type TagTargetCandidateSource =
  | "explicit-target"
  | "workspace-package"
  | "repo-src-fallback";

export type TagTargetSource =
  | "explicit-target"
  | "workspace-package-selected-src"
  | "workspace-package-selected-root"
  | "repo-src-fallback";

export type TagTargetCandidate = {
  candidatePath: string;
  rootRelativeCandidatePath: string;
  source: TagTargetCandidateSource;
  packageDir: string | null;
  packageName: string | null;
};

export type TagResolvedTarget = {
  targetPath: string;
  rootRelativeTargetPath: string;
  source: TagTargetSource;
  packageDir: string | null;
  packageName: string | null;
};

export type TagTargetExecutionResult = {
  target: TagResolvedTarget;
  targetExists: boolean;
  runError: string | null;
  result: TagRunResult | null;
};

export interface TagProgressListener {
  onTargetStarted: (target: TagResolvedTarget) => void;
  onTargetCompleted: (target: TagResolvedTarget, result: TagTargetExecutionResult) => void;
}

export type TagSyncResult = {
  mode: "applied" | "dry-run";
  selectedTargets: TagResolvedTarget[];
  resolvedTargets: TagResolvedTarget[];
  skippedPackages: string[];
  targetResults: TagTargetExecutionResult[];
  filesScanned: number;
  filesChanged: number;
  taggedDeclarations: number;
  versionSummary: string;
  distinctVersions: string[];
  modifiedFiles: string[];
  hookError: string | null;
};

/** Command-orchestrated tag run: config is injected at the CLI boundary (no filesystem config reads in core). */
export type TagSyncOptions = {
  rootDir: string;
  config?: CodefastTagConfig;
  skipPackages?: string[];
  targetPath?: string;
  write: boolean;
  fs: CliFs;
  listener?: TagProgressListener;
};
