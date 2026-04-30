import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";

export interface MirrorPackageArgResolverPort {
  resolveFromCliArg(args: {
    readonly rootDir: string;
    readonly packageArg: string | undefined;
    readonly currentWorkingDirectory: string;
  }): Result<string | undefined, AppError>;
}
