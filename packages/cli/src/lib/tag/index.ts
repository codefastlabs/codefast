export { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io";
export {
  runTagOnTarget,
  runTagSync,
  resolveNearestPackageVersion,
} from "#lib/tag/application/engine";
export type {
  TagFileResult,
  TagProgressListener,
  TagResolvedTarget,
  TagRunOptions,
  TagRunResult,
  TagSyncResult,
  TagSyncOptions,
  TagTargetExecutionResult,
} from "#lib/tag/domain/types";
