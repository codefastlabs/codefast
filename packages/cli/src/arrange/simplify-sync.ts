import type { ArrangeRunResult } from "#/arrange/domain/types";
import { scanArrangeTargets } from "#/arrange/scan-target";
import { processArrangeSimplifyFile } from "#/arrange/simplify-process-file";
import type { AppError } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { ok } from "#/core/result";

/**
 * @since 0.3.16-canary.0
 */
export async function runArrangeSimplify(
  fs: FilesystemPort,
  args: { targetPath: string; write: boolean },
): Promise<Result<ArrangeRunResult, AppError>> {
  const filePaths = scanArrangeTargets(fs, args.targetPath);
  const modifiedFiles: Array<string> = [];
  let totalFound = 0;
  let totalChanged = 0;

  for (const filePath of filePaths) {
    const result = processArrangeSimplifyFile(fs, { filePath, write: args.write });
    totalFound += result.totalFound;
    totalChanged += result.changed;
    if (result.changed > 0) {
      modifiedFiles.push(result.filePath);
    }
  }

  return ok({
    filePaths,
    modifiedFiles,
    totalFound,
    totalChanged,
    hookError: null,
    previewPlans: [],
  });
}
