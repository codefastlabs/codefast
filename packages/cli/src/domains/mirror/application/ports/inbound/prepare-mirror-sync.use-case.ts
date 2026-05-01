import type { GlobalCliOptions } from "#/shell/application/global-cli-options.model";
import type { MirrorSyncCommandPrelude } from "#/domains/mirror/contracts/models";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface PrepareMirrorSyncUseCasePort {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globals: GlobalCliOptions;
  }): Promise<Result<MirrorSyncCommandPrelude, AppError>>;
}
