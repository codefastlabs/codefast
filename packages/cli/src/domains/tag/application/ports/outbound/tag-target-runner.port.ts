import type { TagRunOptions, TagRunResult } from "#/domains/tag/domain/types.domain";

export interface TagTargetRunnerPort {
  runOnTarget(targetPath: string, opts: TagRunOptions): TagRunResult;
}
