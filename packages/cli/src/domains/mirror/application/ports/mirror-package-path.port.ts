import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

/**
 * Application port: resolve mirror package paths strictly under the monorepo root.
 * Covers CLI prelude arguments and programmatic single-package sync filters.
 */
export interface MirrorPackagePathPort {
  resolveFromCliArg(args: {
    readonly rootDir: string;
    readonly packageArg: string | undefined;
    readonly currentWorkingDirectory: string;
  }): Result<string | undefined, AppError>;

  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): Result<string, AppError>;
}
