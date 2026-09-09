import type { ArrangeRunResult } from "#/arrange/domain/types";
import { scanArrangeTargets } from "#/arrange/scan-target";
import { processArrangeSimplifyFile } from "#/arrange/simplify/process-file";
import type { VariantClassNameProbe } from "#/arrange/simplify/variant-classname-probe";
import { createVariantClassNameProbe } from "#/arrange/simplify/variant-classname-probe";
import type { AppError } from "#/core/errors";
import type { Filesystem } from "#/core/filesystem/filesystem";
import type { Result } from "#/core/result";
import { ok } from "#/core/result";

/**
 * Runs the simplify pass over every target file and returns the aggregated result.
 *
 * @since 0.3.16-canary.0
 */
export async function runArrangeSimplify(
  fs: Filesystem,
  args: { targetPath: string; write: boolean; foldVariantClassName?: boolean | undefined },
): Promise<Result<ArrangeRunResult, AppError>> {
  const filePaths = scanArrangeTargets(fs, args.targetPath);
  const modifiedFiles: Array<string> = [];
  let totalFound = 0;
  let totalChanged = 0;

  // The type probe spawns a TypeScript server, so it is created once and only when the fold is requested.
  const probe: VariantClassNameProbe | null = args.foldVariantClassName ? await createVariantClassNameProbe() : null;
  try {
    for (const filePath of filePaths) {
      const fileProbe = probe ? probe.forFile(filePath) : null;
      const result = processArrangeSimplifyFile(fs, { filePath, write: args.write, fileProbe });
      totalFound += result.totalFound;
      totalChanged += result.changed;
      if (result.changed > 0) {
        modifiedFiles.push(result.filePath);
      }
    }
  } finally {
    probe?.dispose();
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
