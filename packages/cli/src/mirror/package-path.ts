import path from "node:path";
import type { FilesystemPort } from "#/core/filesystem/port";
import { AppError } from "#/core/errors";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { normalizePath } from "#/mirror/domain/path-normalizer";

/**
 * @since 0.3.16-canary.0
 */
export function resolveMirrorPackageFromCliArg(
  fs: FilesystemPort,
  args: {
    readonly rootDir: string;
    readonly packageArg: string | undefined;
    readonly currentWorkingDirectory: string;
  },
): Result<string | undefined, AppError> {
  const { rootDir, packageArg, currentWorkingDirectory } = args;
  if (!packageArg) {
    return ok(undefined);
  }
  const rootReal = fs.canonicalPathSync(path.resolve(rootDir));
  const cwdReal = fs.canonicalPathSync(currentWorkingDirectory);
  const resolved = path.isAbsolute(packageArg)
    ? path.resolve(packageArg)
    : path.resolve(cwdReal, packageArg);
  const targetReal = fs.canonicalPathSync(resolved);
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

/**
 * @since 0.3.16-canary.0
 */
export function resolvePackageFilterUnderRoot(
  fs: FilesystemPort,
  rootDir: string,
  packageFilter: string,
): Result<string, AppError> {
  const rootResolved = path.resolve(rootDir);
  const rootReal = fs.canonicalPathSync(rootResolved);
  const resolved = path.isAbsolute(packageFilter)
    ? fs.canonicalPathSync(path.resolve(packageFilter))
    : fs.canonicalPathSync(path.join(rootReal, packageFilter));
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
