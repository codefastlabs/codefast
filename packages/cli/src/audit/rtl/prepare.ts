import type { AuditCommandPrelude } from "#/audit/prepare";
import { resolveRepoRelativePath } from "#/audit/prepare";
import { loadCodefastConfig } from "#/core/config";
import { AppError, messageFrom } from "#/core/errors";
import type { Filesystem } from "#/core/filesystem/filesystem";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { resolveProjectRoot } from "#/core/workspace/resolver";

/**
 * Loads config and resolves the scan target for `audit rtl`.
 *
 * @since 0.5.0-canary.6
 */
export async function prepareRtlAudit(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<AuditCommandPrelude, AppError>> {
  let rootDir: string;
  try {
    // Realpath so allowlist keys (`path.relative(rootDir, file)`) stay stable when cwd is a symlink.
    rootDir = fs.canonicalPathSync(resolveProjectRoot(args.currentWorkingDirectory, fs).rootDir);
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
