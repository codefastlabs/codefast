import type { CliFs } from "#lib/core/application/ports/cli-io.port";
import {
  resolveNearestPackageVersion,
  runTagOnTarget as runTagOnTargetWithTreeWalk,
  runTagSync,
} from "#lib/tag/application/engine";
import type { TagRunOptions, TagRunResult } from "#lib/tag/domain/types";
import { tagTypeScriptTreeWalkAdapter } from "#lib/tag/infra/typescript-tree-walk.adapter";

export { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io";

/** Default composition: uses the shared TS/TSX tree walk adapter. */
export function runTagOnTarget(targetPath: string, opts: TagRunOptions, fs: CliFs): TagRunResult {
  return runTagOnTargetWithTreeWalk(targetPath, opts, fs, tagTypeScriptTreeWalkAdapter);
}

export { runTagSync, resolveNearestPackageVersion };
export type { TagSyncExecutionInput, TagSyncRunDeps } from "#lib/tag/application/engine";
export { tagTargetResolverAdapter } from "#lib/tag/infra/tag-target-resolver.adapter";
export type {
  TagFileResult,
  TagProgressListener,
  TagResolvedTarget,
  TagRunOptions,
  TagRunResult,
  TagSyncResult,
  TagTargetExecutionResult,
} from "#lib/tag/domain/types";
export type { TagSyncOptions } from "#lib/tag/infra/tag-sync-cli-options";
export {
  createTagProgressListener,
  formatProgress,
  formatSummary,
  formatTargetTable,
  formatWarningsAndErrors,
} from "#lib/tag/presentation/tag-presenter";
export type { TagProgressEvent } from "#lib/tag/presentation/tag-presenter";
