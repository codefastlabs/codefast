import type { CommandContext } from "#core/command";
import { selectPackageConfig } from "#core/config/package-selector";
import type { AppError } from "#core/errors";
import type { Result } from "#core/result";
import { ok } from "#core/result";
import { packagesInTarget } from "#core/workspace/workspace";
import type { ExportsPackageOutcome, ExportsReport } from "#exports/domain/types";
import { syncPackageExports } from "#exports/sync-package";

/**
 * Regenerates the exports map of every package the target reaches.
 */
export async function runExportsGenerate(context: CommandContext<"dryRun">): Promise<Result<ExportsReport, AppError>> {
  const { fs, workspace, target, flags } = context;
  const packages: Array<ExportsPackageOutcome> = [];
  for (const workspacePackage of packagesInTarget(workspace, target.path)) {
    const packageConfig = selectPackageConfig(workspace.config.exports, workspacePackage.name);
    packages.push(await syncPackageExports(fs, workspacePackage, packageConfig, !flags.dryRun));
  }
  return ok({ packages });
}
