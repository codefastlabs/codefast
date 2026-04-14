export { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io";
export {
  runTagOnTarget,
  runTagSync,
  resolveNearestPackageVersion,
} from "#lib/tag/application/engine";
export type {
  TagFileResult,
  TagRunOptions,
  TagRunResult,
  TagSyncOptions,
} from "#lib/tag/domain/types";
