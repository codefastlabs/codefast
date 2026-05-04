import type { CodefastConfig } from "#/core/config/schema";

/**
 * @since 0.3.16-canary.0
 */
export type TagFileResult = {
  filePath: string;
  taggedDeclarations: number;
  changed: boolean;
};

/**
 * @since 0.3.16-canary.0
 */
export type TagRunResult = {
  version: string;
  filesScanned: number;
  filesChanged: number;
  taggedDeclarations: number;
  fileResults: TagFileResult[];
};

/**
 * @since 0.3.16-canary.0
 */
export type TagRunOptions = {
  write: boolean;
};

type TagTargetCandidateSource = "explicit-target" | "workspace-package" | "repo-src-fallback";

/**
 * @since 0.3.16-canary.0
 */
export type TagTargetSource =
  | "explicit-target"
  | "workspace-package-selected-src"
  | "workspace-package-selected-root"
  | "repo-src-fallback";

/**
 * @since 0.3.16-canary.0
 */
export type TagTargetCandidate = {
  candidatePath: string;
  rootRelativeCandidatePath: string;
  source: TagTargetCandidateSource;
  packageDir: string | null;
  packageName: string | null;
};

/**
 * @since 0.3.16-canary.0
 */
export type TagResolvedTarget = {
  targetPath: string;
  rootRelativeTargetPath: string;
  source: TagTargetSource;
  packageDir: string | null;
  packageName: string | null;
};

/**
 * @since 0.3.16-canary.0
 */
export type TagTargetExecutionResult = {
  target: TagResolvedTarget;
  targetExists: boolean;
  runError: string | null;
  result: TagRunResult | null;
};

/**
 * @since 0.3.16-canary.0
 */
export interface TagProgressListener {
  onTargetStarted: (target: TagResolvedTarget) => void;
  onTargetCompleted: (target: TagResolvedTarget, result: TagTargetExecutionResult) => void;
}

/**
 * @since 0.3.16-canary.0
 */
export type TagSyncResult = {
  mode: "applied" | "dry-run";
  selectedTargets: TagResolvedTarget[];
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

/**
 * @since 0.3.16-canary.0
 */
export interface TagCommandPrelude {
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly resolvedTargetPath: string | undefined;
}
