import type { AuditCommandPrelude } from "#audit/prepare";
import { resolveRepoRelativePath } from "#audit/prepare";
import { loadCodefastConfig } from "#core/config";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { resolveProjectRoot } from "#core/workspace/resolver";

/**
 * Loads config and resolves the scan target for `audit constants`.
 *
 * @remarks The target is the library tree the convention holds over, from `audit.constants.target`
 * unless the command names one.
 *
 * @since 0.11.0
 */
export async function prepareConstantAudit(
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
  const { config } = loadedOutcome.value;
  const constantsConfig = config.audit?.constants ?? {};
  const resolvedTargetInput = args.rawTarget ?? constantsConfig.target;
  if (resolvedTargetInput === undefined) {
    return err(
      new AppError(
        "VALIDATION_ERROR",
        "audit constants needs a target: pass one, or set audit.constants.target in codefast.config",
      ),
    );
  }
  const targetPath = resolveRepoRelativePath(
    args.rawTarget !== undefined ? args.currentWorkingDirectory : rootDir,
    resolvedTargetInput,
  );
  if (!fs.existsSync(targetPath)) {
    return err(new AppError("NOT_FOUND", `Not found: ${targetPath}`));
  }
  return ok({ rootDir, targetPath: fs.canonicalPathSync(targetPath), allowlist: constantsConfig.allowlist ?? [] });
}
