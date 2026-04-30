import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface MirrorPackageArgResolverPort {
  resolveFromCliArg(args: {
    readonly rootDir: string;
    readonly packageArg: string | undefined;
    readonly currentWorkingDirectory: string;
  }): Result<string | undefined, AppError>;
}
