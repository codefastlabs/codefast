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
 * Loads config and resolves the scan target for `audit rtl`.
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

/**
 * Loads config and resolves the scan target for `audit links`.
 *
 * @remarks Defaults to the repo root rather than a configured path: a link audit that only covers one
 * package cannot see the cross-package references that are the ones most likely to rot.
 *
 * @since 0.5.0
 */
export async function prepareLinkAudit(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<RtlAuditCommandPrelude, AppError>> {
  let rootDir: string;
  try {
    rootDir = fs.canonicalPathSync(findRepoRoot(args.currentWorkingDirectory, fs));
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }

  const loadedOutcome = await loadCodefastConfig(rootDir, fs);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }
  const linksConfig = loadedOutcome.value.config.audit?.links ?? {};

  const targetPath =
    args.rawTarget === undefined ? rootDir : resolveRepoRelativePath(args.currentWorkingDirectory, args.rawTarget);
  if (!fs.existsSync(targetPath)) {
    return err(new AppError("NOT_FOUND", `Not found: ${targetPath}`));
  }

  return ok({
    rootDir,
    targetPath: fs.canonicalPathSync(targetPath),
    allowlist: linksConfig.allowlist ?? [],
  });
}

/**
 * Loads config and resolves the scan target for `audit comments`.
 *
 * @remarks Defaults to the repo root: a divider convention that only holds inside one package
 * is not a convention.
 */
export async function prepareCommentAudit(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<RtlAuditCommandPrelude, AppError>> {
  let rootDir: string;
  try {
    rootDir = fs.canonicalPathSync(findRepoRoot(args.currentWorkingDirectory, fs));
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }

  const loadedOutcome = await loadCodefastConfig(rootDir, fs);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }
  const commentsConfig = loadedOutcome.value.config.audit?.comments ?? {};

  const targetPath =
    args.rawTarget === undefined ? rootDir : resolveRepoRelativePath(args.currentWorkingDirectory, args.rawTarget);
  if (!fs.existsSync(targetPath)) {
    return err(new AppError("NOT_FOUND", `Not found: ${targetPath}`));
  }

  return ok({
    rootDir,
    targetPath: fs.canonicalPathSync(targetPath),
    allowlist: commentsConfig.allowlist ?? [],
  });
}
