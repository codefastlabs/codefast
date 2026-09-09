import path from "node:path";

import { loadCodefastConfig } from "#/core/config";
import type { CodefastConfig } from "#/core/config/schema";
import { AppError, messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { resolveProjectRoot } from "#/core/workspace/resolver";

/**
 * Shared prelude for an audit: repo root and the canonicalized scan target with its allowlist.
 *
 * @since 0.5.0-canary.6
 */
export type AuditCommandPrelude = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist: ReadonlyArray<string>;
};

/**
 * Resolves a path that may be absolute or relative to `rootDir`.
 *
 * @since 0.5.0-canary.6
 */
export function resolveRepoRelativePath(rootDir: string, maybeRelative: string): string {
  return path.isAbsolute(maybeRelative) ? path.resolve(maybeRelative) : path.resolve(rootDir, maybeRelative);
}

/**
 * Loads config and resolves the repo root as the scan target, taking the allowlist the caller selects.
 *
 * @remarks Every repo-wide audit shares this prelude; only the config key its allowlist comes from differs.
 */
export async function prepareRepoRootAudit(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
  selectAllowlist: (config: CodefastConfig) => ReadonlyArray<string>,
): Promise<Result<AuditCommandPrelude, AppError>> {
  let rootDir: string;
  try {
    rootDir = fs.canonicalPathSync(resolveProjectRoot(args.currentWorkingDirectory, fs).rootDir);
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }

  const loadedOutcome = await loadCodefastConfig(rootDir, fs);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }

  const targetPath =
    args.rawTarget === undefined ? rootDir : resolveRepoRelativePath(args.currentWorkingDirectory, args.rawTarget);
  if (!fs.existsSync(targetPath)) {
    return err(new AppError("NOT_FOUND", `Not found: ${targetPath}`));
  }

  return ok({
    rootDir,
    targetPath: fs.canonicalPathSync(targetPath),
    allowlist: selectAllowlist(loadedOutcome.value.config),
  });
}
