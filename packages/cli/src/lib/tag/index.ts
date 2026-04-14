export { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io";
export {
  runTagOnTarget,
  runTagSync,
  resolveNearestPackageVersion,
} from "#lib/tag/application/engine";
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
