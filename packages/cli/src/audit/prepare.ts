import { resolveRepoRelativePath } from "#/audit/cli-schema";
import { loadCodefastConfig } from "#/core/config";
import { AppError, messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { findRepoRoot } from "#/core/workspace/resolver";

/**
 * Shared prelude for `audit rtl`: repo root and the canonicalized scan target with its allowlist.
 *
 * @since 1.0.0-canary.7
 */
export type RtlAuditCommandPrelude = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist: ReadonlyArray<string>;
};

/**
 * Load config and resolve the scan target for `audit rtl`.
 *
 * @since 1.0.0-canary.7
 */
export async function prepareRtlAudit(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<RtlAuditCommandPrelude, AppError>> {
  let rootDir: string;
  try {
    // Realpath so allowlist keys (`path.relative(rootDir, file)`) stay stable when cwd is a symlink.
    rootDir = fs.canonicalPathSync(findRepoRoot(args.currentWorkingDirectory, fs));
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }

  const loadedOutcome = await loadCodefastConfig(rootDir, fs);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }
  const { config } = loadedOutcome.value;
  const rtlConfig = config.audit?.rtl ?? {};

  const targetFromCli = args.rawTarget;
  const targetFromConfig = rtlConfig.target;
  const resolvedTargetInput = targetFromCli ?? targetFromConfig;
  if (resolvedTargetInput === undefined) {
    return err(
      new AppError(
        "VALIDATION_ERROR",
        "Missing scan target: pass a path argument or set audit.rtl.target in codefast.config",
      ),
    );
  }

  const targetPath = resolveRepoRelativePath(
    targetFromCli !== undefined ? args.currentWorkingDirectory : rootDir,
    resolvedTargetInput,
  );
  if (!fs.existsSync(targetPath)) {
    return err(new AppError("NOT_FOUND", `Not found: ${targetPath}`));
  }

  return ok({
    rootDir,
    targetPath: fs.canonicalPathSync(targetPath),
    allowlist: rtlConfig.allowlist ?? [],
  });
}
