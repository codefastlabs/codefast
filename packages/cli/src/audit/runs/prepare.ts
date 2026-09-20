import type { AuditCommandPrelude } from "#audit/prepare";
import { loadCodefastConfig } from "#core/config";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { resolveProjectRoot } from "#core/workspace/resolver";

/** Every direct child of `benchmarks/` that declares a `package.json` is a suite by default. */
const DEFAULT_TARGET = "benchmarks/*";

/**
 * Loads config and resolves the suite-root glob for `audit runs`.
 *
 * @remarks Unlike every other audit's target, this one is a glob over suite directories rather
 * than a single literal path — `audit.runs.target` names the pattern, not a directory to check.
 */
export async function prepareRunsAudit(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
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

  const targetPath = args.rawTarget ?? loadedOutcome.value.config.audit?.runs?.target ?? DEFAULT_TARGET;

  return ok({ rootDir, targetPath, allowlist: [] });
}
