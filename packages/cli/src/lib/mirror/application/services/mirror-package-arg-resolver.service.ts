import path from "node:path";
import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { CliFsToken } from "#/lib/core/contracts/tokens";
import { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";
import type { MirrorPackageArgResolverPort } from "#/lib/mirror/application/ports/mirror-package-arg-resolver.port";

@injectable([inject(CliFsToken)])
export class MirrorPackageArgResolverImpl implements MirrorPackageArgResolverPort {
  constructor(private readonly fs: CliFs) {}

  resolveFromCliArg(args: {
    readonly rootDir: string;
    readonly packageArg: string | undefined;
    readonly currentWorkingDirectory: string;
  }): Result<string | undefined, AppError> {
    const { rootDir, packageArg, currentWorkingDirectory } = args;
    if (!packageArg) {
      return ok(undefined);
    }
    const rootReal = this.fs.canonicalPathSync(path.resolve(rootDir));
    const cwdReal = this.fs.canonicalPathSync(currentWorkingDirectory);
    const resolved = path.isAbsolute(packageArg)
      ? path.resolve(packageArg)
      : path.resolve(cwdReal, packageArg);
    const targetReal = this.fs.canonicalPathSync(resolved);
    const relativePath = path.relative(rootReal, targetReal);
    const normalized = this.normalizePathSegments(relativePath);
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

  private normalizePathSegments(relPath: string): string {
    return relPath.split(path.sep).join("/").replace(/\\/g, "/");
  }
}
