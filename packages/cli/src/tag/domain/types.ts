import type { CodefastConfig } from "#/core/config/schema";

/**
 * Per-file outcome of a tag run.
 *
 * @since 0.3.16-canary.0
 */
export type TagFileResult = {
  filePath: string;
  taggedDeclarations: number;
  changed: boolean;
};

/**
 * Outcome of tagging one target: the version stamped and the per-file tallies.
 *
 * @since 0.3.16-canary.0
 */
export type TagRunResult = {
  version: string;
  filesScanned: number;
  filesChanged: number;
  taggedDeclarations: number;
  fileResults: Array<TagFileResult>;
};

/**
 * Options for one target's tag run.
 *
 * @since 0.3.16-canary.0
 */
export type TagRunOptions = {
  write: boolean;
};

type TagTargetCandidateSource = "explicit-target" | "workspace-package" | "repo-src-fallback";

/**
 * How a resolved tag target was chosen.
 *
 * @since 0.3.16-canary.0
 */
type TagTargetSource =
  | "explicit-target"
  | "workspace-package-selected-src"
  | "workspace-package-selected-root"
  | "repo-src-fallback";

/**
 * A candidate path a tag run may resolve into a target.
 *
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
 * A directory or file a tag run will stamp, with its owning package when known.
 *
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
 * One target's execution outcome, carrying either its run result or its error.
 *
 * @since 0.3.16-canary.0
 */
export type TagTargetExecutionResult = {
  target: TagResolvedTarget;
  targetExists: boolean;
  runError: string | null;
  result: TagRunResult | null;
};

/**
 * Callbacks a tag run invokes as each target starts and completes.
 *
 * @since 0.3.16-canary.0
 */
export interface TagProgressListener {
  onTargetStarted: (target: TagResolvedTarget) => void;
  onTargetCompleted: (target: TagResolvedTarget, result: TagTargetExecutionResult) => void;
}

/**
 * Aggregate outcome of a tag run across every selected target.
 *
 * @since 0.3.16-canary.0
 */
export type TagSyncResult = {
  mode: "applied" | "dry-run";
  selectedTargets: Array<TagResolvedTarget>;
  skippedPackages: Array<string>;
  targetResults: Array<TagTargetExecutionResult>;
  filesScanned: number;
  filesChanged: number;
  taggedDeclarations: number;
  versionSummary: string;
  distinctVersions: Array<string>;
  modifiedFiles: Array<string>;
  hookError: string | null;
};

/**
 * Everything the `tag` action needs resolved before a run: root, config, and target path.
 *
 * @since 0.3.16-canary.0
 */
export interface TagCommandPrelude {
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly resolvedTargetPath: string | undefined;
}
