import path from "node:path";

import { AppError } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { isWithinDirectory, relativePosixPath } from "#core/path";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";

/**
 * What a command acts on: a file or directory inside the project root.
 */
export interface Target {
  readonly path: string;
  /** The target as a POSIX path from the root, `"."` for the root itself. */
  readonly relativePath: string;
  readonly isFile: boolean;
}

/**
 * Resolves a command's target: the given path against the working directory, else a configured default against the
 * root, else the root itself.
 */
export function resolveTarget(
  fs: Filesystem,
  input: {
    readonly rootDir: string;
    readonly currentWorkingDirectory: string;
    readonly given: string | undefined;
    readonly configured: string | undefined;
  },
): Result<Target, AppError> {
  const { rootDir } = input;
  const requested =
    input.given !== undefined
      ? path.resolve(input.currentWorkingDirectory, input.given)
      : path.resolve(rootDir, input.configured ?? ".");
  if (!fs.existsSync(requested)) {
    return err(new AppError("NOT_FOUND", `Not found: ${requested}`));
  }
  const targetPath = fs.canonicalPathSync(requested);
  if (!isWithinDirectory(rootDir, targetPath)) {
    return err(new AppError("VALIDATION_ERROR", `${targetPath} lies outside the project root ${rootDir}`));
  }
  return ok({
    path: targetPath,
    relativePath: relativePosixPath(rootDir, targetPath),
    isFile: fs.statSync(targetPath).isFile(),
  });
}
