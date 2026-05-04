import type { CodefastAfterWriteHook, CodefastArrangeConfig } from "#/config/schema";
import { AppError } from "#/core/errors";
import { messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem";
import type { Result } from "#/core/result";
import { ok } from "#/core/result";
import type { ArrangeSyncRunRequest } from "#/arrange/cli-schema";
import type { ArrangeRunResult } from "#/arrange/domain/types";
import type { GroupFileWorkPlan } from "#/arrange/domain/grouping-service";
import { scanArrangeTargets } from "#/arrange/scan-target";
import { processArrangeGroupFile } from "#/arrange/process-file";

async function runOnAfterWriteHook(
  hook: CodefastAfterWriteHook | undefined,
  modifiedFiles: string[],
): Promise<string | null> {
  if (!hook || modifiedFiles.length === 0) {
    return null;
  }
  try {
    await hook({ files: modifiedFiles });
    return null;
  } catch (caughtHookError: unknown) {
    return `[arrange] onAfterWrite hook failed: ${messageFrom(caughtHookError)}`;
  }
}

export async function runArrangeSync(
  fs: FilesystemPort,
  request: ArrangeSyncRunRequest,
): Promise<Result<ArrangeRunResult, AppError>> {
  const filePaths = scanArrangeTargets(fs, request.targetPath);
  const modifiedFiles: string[] = [];
  const previewPlans: GroupFileWorkPlan[] = [];
  let totalFound = 0;
  let totalChanged = 0;

  const groupOptions = {
    write: request.write,
    withClassName: !!request.withClassName,
    cnImport: request.cnImport,
  };

  for (const filePath of filePaths) {
    const fileProcessResult = processArrangeGroupFile(fs, { filePath, options: groupOptions });
    totalFound += fileProcessResult.totalFound;
    totalChanged += fileProcessResult.changed;
    if (fileProcessResult.changed > 0) {
      modifiedFiles.push(fileProcessResult.filePath);
    }
    if (fileProcessResult.workPlan) {
      previewPlans.push(fileProcessResult.workPlan);
    }
  }

  const arrangeConfig = request.config as CodefastArrangeConfig | undefined;
  const hookError =
    request.write && modifiedFiles.length > 0
      ? await runOnAfterWriteHook(arrangeConfig?.onAfterWrite, modifiedFiles)
      : null;

  return ok({ filePaths, modifiedFiles, totalFound, totalChanged, hookError, previewPlans });
}
