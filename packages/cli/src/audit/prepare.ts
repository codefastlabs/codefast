import { resolveRepoRelativePath } from "#/audit/cli-schema";
import { loadCodefastConfig } from "#/core/config";
import type { CodefastConfig } from "#/core/config/schema";
import { AppError, messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { findRepoRoot } from "#/core/workspace/resolver";

/**
 * Shared prelude for `audit rtl`: repo root, config, and resolved scan target.
 */
export type RtlAuditCommandPrelude = {
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly targetPath: string;
  readonly allowlist: ReadonlyArray<string>;
};

/**
 * Load config and resolve the scan target for `audit rtl`.
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
    rootDir = findRepoRoot(args.currentWorkingDirectory, fs);
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
    config,
    targetPath: fs.canonicalPathSync(targetPath),
    allowlist: rtlConfig.allowlist ?? [],
  });
}
