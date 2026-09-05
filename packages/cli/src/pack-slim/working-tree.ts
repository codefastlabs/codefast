import { execFileSync } from "node:child_process";

import { AppError, messageFrom } from "#/core/errors";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";

/**
 * Whether git's tracked-only porcelain output reports any uncommitted change.
 *
 * @remarks The output is read with `--untracked-files=no`, so untracked and gitignored paths (like the freshly built
 * `dist`) never appear — any non-blank line is a staged or unstaged change to a tracked file.
 */
export function hasUncommittedTrackedChanges(porcelainOutput: string): boolean {
  return porcelainOutput.split("\n").some((line) => line.trim().length > 0);
}

/**
 * Reads git's porcelain status for tracked files only, under the given root.
 */
function readTrackedWorkingTreeStatus(rootDir: string): string {
  return execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
    cwd: rootDir,
    encoding: "utf8",
  });
}

/**
 * Refuses when the git working tree carries uncommitted tracked changes, so a destructive slim never lands on real work.
 *
 * @remarks pack-slim rewrites tracked `package.json` files and deletes build output; its result must never be committed.
 * A caller passing `--force` skips this, and `--dry-run` never reaches it because it writes nothing.
 */
export function ensureWorkingTreeClean(rootDir: string): Result<void, AppError> {
  let porcelain: string;
  try {
    porcelain = readTrackedWorkingTreeStatus(rootDir);
  } catch (caughtError: unknown) {
    return err(
      new AppError(
        "INFRA_FAILURE",
        `Could not check the git working tree: ${messageFrom(caughtError)}. Pass --force to skip this check.`,
        caughtError,
      ),
    );
  }
  if (hasUncommittedTrackedChanges(porcelain)) {
    return err(
      new AppError(
        "VALIDATION_ERROR",
        "pack-slim refuses to run: the git working tree has uncommitted tracked changes. " +
          "Commit or stash them, use --dry-run to preview, or pass --force to override.",
      ),
    );
  }
  return ok(undefined);
}
