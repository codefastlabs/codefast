import path from "node:path";
import { inject, injectable } from "@codefast/di";
import type { MirrorPackagePathPort } from "#/domains/mirror/application/ports/outbound/mirror-package-path.port";
import { normalizePath } from "#/domains/mirror/domain/path-normalizer.value-object";
import type { CliFs } from "#/shell/application/ports/outbound/cli-io.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";

@injectable([inject(CliFsToken)])
export class MirrorPackagePathResolver implements MirrorPackagePathPort {
  constructor(private readonly fileSystem: CliFs) {}

  resolveFromCliArg(args: {
    readonly rootDir: string;
    readonly packageArg: string | undefined;
    readonly currentWorkingDirectory: string;
  }): Result<string | undefined, AppError> {
    const { rootDir, packageArg, currentWorkingDirectory } = args;
    if (!packageArg) {
      return ok(undefined);
    }
    const rootReal = this.fileSystem.canonicalPathSync(path.resolve(rootDir));
    const cwdReal = this.fileSystem.canonicalPathSync(currentWorkingDirectory);
    const resolved = path.isAbsolute(packageArg)
      ? path.resolve(packageArg)
      : path.resolve(cwdReal, packageArg);
    const targetReal = this.fileSystem.canonicalPathSync(resolved);
    const relativePath = path.relative(rootReal, targetReal);
    const normalized = normalizePath(relativePath);
    if (
      normalized.startsWith("..") ||
      path.isAbsolute(normalized) ||
      normalized === "" ||
      normalized === "."
    ) {
      return err(
        new AppError(
          "VALIDATION_ERROR",
          `Package path must be a subdirectory under monorepo root: ${rootDir}`,
        ),
      );
    }
    return ok(normalized);
  }

  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): Result<string, AppError> {
    const rootResolved = path.resolve(rootDir);
    const rootReal = this.fileSystem.canonicalPathSync(rootResolved);
    const resolved = path.isAbsolute(packageFilter)
      ? this.fileSystem.canonicalPathSync(path.resolve(packageFilter))
      : this.fileSystem.canonicalPathSync(path.join(rootReal, packageFilter));
    const relativePath = path.relative(rootReal, resolved);
    const normalized = normalizePath(relativePath);
    if (
      normalized.startsWith("..") ||
      path.isAbsolute(normalized) ||
      normalized === "" ||
      normalized === "."
    ) {
      return err(
        new AppError(
          "VALIDATION_ERROR",
          `Package path must be a subdirectory under monorepo root: ${rootDir}`,
        ),
      );
    }
    return ok(normalized);
  }
}
