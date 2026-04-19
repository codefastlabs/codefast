import path from "node:path";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { AppError } from "#/lib/core/domain/errors.domain";
import { appError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";

export type ResolveMirrorPackageArgInput = {
  readonly fs: CliFs;
  readonly rootDir: string;
  readonly packageArg: string | undefined;
  readonly currentWorkingDirectory: string;
};

function normalizePathSegments(relPath: string): string {
  return relPath.split(path.sep).join("/").replace(/\\/g, "/");
}

export function resolveMirrorPackageArgToRelative(
  input: ResolveMirrorPackageArgInput,
): Result<string | undefined, AppError> {
  const { fs, rootDir, packageArg, currentWorkingDirectory } = input;
  if (!packageArg) {
    return ok(undefined);
  }
  const rootReal = fs.canonicalPathSync(path.resolve(rootDir));
  const cwdReal = fs.canonicalPathSync(currentWorkingDirectory);
  const resolved = path.isAbsolute(packageArg)
    ? path.resolve(packageArg)
    : path.resolve(cwdReal, packageArg);
  const targetReal = fs.canonicalPathSync(resolved);
  const rel = path.relative(rootReal, targetReal);
  const normalized = normalizePathSegments(rel);
  if (
    normalized.startsWith("..") ||
    path.isAbsolute(normalized) ||
    normalized === "" ||
    normalized === "."
  ) {
    return err(
      appError(
        "VALIDATION_ERROR",
        `Package path must be a subdirectory under monorepo root: ${rootDir}`,
      ),
    );
  }
  return ok(normalized);
}
