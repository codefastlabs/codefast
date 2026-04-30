import type { TagRunOptions, TagRunResult } from "#/lib/tag/domain/types.domain";

export interface TagTargetRunnerService {
  runOnTarget(targetPath: string, opts: TagRunOptions): TagRunResult;
}

export interface TagCliTargetPathResolverService {
  resolveCliTargetPath(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): string | undefined;
}
