import path from "node:path";
import type { CodefastAfterWriteHook } from "#lib/config";
import { messageFromCaughtUnknown } from "#lib/infra/caught-unknown-message";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import { ArrangeError, ArrangeErrorCode } from "#lib/arrange/domain/errors";
import { groupFile } from "#lib/arrange/application/group-file";
import type {
  ArrangeRunOnTargetOptions,
  ArrangeRunResult,
  ArrangeSyncOptions,
} from "#lib/arrange/domain/types";
import { walkTsxFiles } from "#lib/arrange/infra/walk";

export function runOnTarget(
  target: string,
  options: ArrangeRunOnTargetOptions,
  fs: CliFs,
  logger: CliLogger,
): ArrangeRunResult {
  const { out } = logger;
  if (!fs.existsSync(target)) {
    throw new ArrangeError(ArrangeErrorCode.TARGET_NOT_FOUND, `Not found: ${target}`);
  }

  const filePaths = fs.statSync(target).isDirectory() ? walkTsxFiles(target, fs) : [target];
  const modifiedFiles: string[] = [];

  let totalFound = 0;
  let totalChanged = 0;

  for (const filePath of filePaths) {
    const result = groupFile(filePath, options, fs, logger);
    totalFound += result.totalFound;
    totalChanged += result.changed;
    if (result.changed > 0) modifiedFiles.push(result.filePath);
  }

  out(
    `\nTotal: ${filePaths.length} file(s), ${totalFound} site(s) (cn/tv/JSX className) to review.`,
  );
  if (options.write) {
    out(`Applied: ${totalChanged} site(s) updated.`);
  } else {
    out(
      `(Run "apply" to write changes, or "pnpm cli:arrange-apply" / "pnpm exec codefast arrange apply")`,
    );
  }

  const showCascadeHint = options.write ? totalChanged > 0 : totalFound > 0;
  if (showCascadeHint) {
    out(
      "Note: class order may change across concern groups — smoke-test the UI if you rely on cascade order.",
    );
  }

  return {
    filePaths,
    modifiedFiles,
    totalFound,
    totalChanged,
  };
}

async function runArrangeOnAfterWriteHook(
  logger: CliLogger,
  hook: CodefastAfterWriteHook | undefined,
  modifiedFiles: string[],
): Promise<void> {
  if (!hook || modifiedFiles.length === 0) return;
  try {
    await hook({ files: modifiedFiles });
  } catch (caughtHookError: unknown) {
    logger.err(`[arrange] onAfterWrite hook failed: ${messageFromCaughtUnknown(caughtHookError)}`);
  }
}

/**
 * CLI entry: run arrange preview/apply using config injected by the command layer.
 * @returns Process exit code (`0`, or `1` when the target path is missing).
 */
export async function runArrangeSync(opts: ArrangeSyncOptions): Promise<number> {
  void opts.rootDir;
  const { fs, logger } = opts;
  const resolvedTarget = path.resolve(opts.targetPath);

  let result: ArrangeRunResult;
  try {
    result = runOnTarget(
      resolvedTarget,
      {
        write: opts.write,
        withClassName: !!opts.withClassName,
        cnImport: opts.cnImport,
      },
      fs,
      logger,
    );
  } catch (caughtError: unknown) {
    if (
      caughtError instanceof ArrangeError &&
      caughtError.code === ArrangeErrorCode.TARGET_NOT_FOUND
    ) {
      logger.err(caughtError.message);
      return 1;
    }
    throw caughtError;
  }

  if (opts.write && result.modifiedFiles.length > 0) {
    await runArrangeOnAfterWriteHook(logger, opts.config?.onAfterWrite, result.modifiedFiles);
  }

  return 0;
}
