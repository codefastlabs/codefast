import type {
  CodefastAfterWriteHook,
  CodefastArrangeConfig,
} from "#lib/config/domain/schema.domain";
import { appError, type AppError } from "#lib/core/domain/errors.domain";
import { err, ok, type Result } from "#lib/core/domain/result.model";
import type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";
import type { CliPath } from "#lib/core/application/ports/path.port";
import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message.util";
import { groupFile } from "#lib/arrange/application/use-cases/group-file.use-case";
import type { GroupFilePreviewPort } from "#lib/arrange/application/ports/group-file-preview.port";
import type { DomainSourceParserPort } from "#lib/arrange/application/ports/domain-source-parser.port";
import type { FileWalkerPort } from "#lib/arrange/application/ports/file-walker.port";
import type {
  ArrangeRunTargetRequest,
  ArrangeSyncRunRequest,
} from "#lib/arrange/application/requests/arrange-sync.request";
import type { ArrangeRunResult } from "#lib/arrange/domain/types.domain";

export type ArrangeSyncDeps = {
  readonly fs: CliFs;
  readonly logger: CliLogger;
  readonly path: CliPath;
  readonly fileWalker: FileWalkerPort;
  readonly domainSourceParser: DomainSourceParserPort;
  readonly groupFilePreview: GroupFilePreviewPort;
};

export function runOnTarget(
  request: ArrangeRunTargetRequest,
  deps: ArrangeSyncDeps,
): Result<ArrangeRunResult, AppError> {
  const { out } = deps.logger;
  const { fs, fileWalker, domainSourceParser } = deps;
  if (!fs.existsSync(request.targetPath)) {
    return err(appError("NOT_FOUND", `Not found: ${request.targetPath}`));
  }

  const filePaths = fs.statSync(request.targetPath).isDirectory()
    ? fileWalker.walkTypeScriptFiles(request.targetPath, fs)
    : [request.targetPath];
  const modifiedFiles: string[] = [];

  let totalFound = 0;
  let totalChanged = 0;

  const groupOptions = {
    write: request.write,
    withClassName: !!request.withClassName,
    cnImport: request.cnImport,
  };

  for (const filePath of filePaths) {
    const result = groupFile(
      filePath,
      groupOptions,
      fs,
      deps.logger,
      domainSourceParser,
      deps.groupFilePreview,
    );
    totalFound += result.totalFound;
    totalChanged += result.changed;
    if (result.changed > 0) {
      modifiedFiles.push(result.filePath);
    }
  }

  out(
    `\nTotal: ${filePaths.length} file(s), ${totalFound} site(s) (cn/tv/JSX className) to review.`,
  );
  if (request.write) {
    out(`Applied: ${totalChanged} site(s) updated.`);
  } else {
    out(
      `(Run "apply" to write changes, or "pnpm cli:arrange-apply" / "pnpm exec codefast arrange apply")`,
    );
  }

  const showCascadeHint = request.write ? totalChanged > 0 : totalFound > 0;
  if (showCascadeHint) {
    out(
      "Note: class order may change across concern groups — smoke-test the UI if you rely on cascade order.",
    );
  }

  return ok({
    filePaths,
    modifiedFiles,
    totalFound,
    totalChanged,
  });
}

async function runArrangeOnAfterWriteHook(
  logger: CliLogger,
  hook: CodefastAfterWriteHook | undefined,
  modifiedFiles: string[],
): Promise<void> {
  if (!hook || modifiedFiles.length === 0) {
    return;
  }
  try {
    await hook({ files: modifiedFiles });
  } catch (caughtHookError: unknown) {
    logger.err(`[arrange] onAfterWrite hook failed: ${messageFromCaughtUnknown(caughtHookError)}`);
  }
}

/**
 * Preview/apply orchestration: resolves target path, runs grouping pipeline, optional hook.
 */
export async function runArrangeSync(
  request: ArrangeSyncRunRequest,
  deps: ArrangeSyncDeps,
): Promise<Result<number, AppError>> {
  void request.rootDir;
  const resolvedTarget = deps.path.resolve(request.targetPath);

  const runTargetRequest: ArrangeRunTargetRequest = {
    targetPath: resolvedTarget,
    write: request.write,
    withClassName: request.withClassName,
    cnImport: request.cnImport,
  };

  const runOutcome = runOnTarget(runTargetRequest, deps);
  if (!runOutcome.ok) {
    if (runOutcome.error.code === "NOT_FOUND") {
      deps.logger.err(runOutcome.error.message);
    }
    return runOutcome;
  }

  const result = runOutcome.value;

  if (request.write && result.modifiedFiles.length > 0) {
    const arrangeConfig = request.config as CodefastArrangeConfig | undefined;
    await runArrangeOnAfterWriteHook(
      deps.logger,
      arrangeConfig?.onAfterWrite,
      result.modifiedFiles,
    );
  }

  return ok(0);
}
