import type { MirrorSyncCommandPrelude } from "#/lib/mirror/contracts/models";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";

export interface PrepareMirrorOrchestrator {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globalCliRaw: unknown;
  }): Promise<Result<MirrorSyncCommandPrelude, AppError>>;
}
