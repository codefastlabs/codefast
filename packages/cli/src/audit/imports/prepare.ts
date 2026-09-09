import type { AuditCommandPrelude } from "#/audit/prepare";
import { prepareRepoRootAudit } from "#/audit/prepare";
import type { AppError } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";

/**
 * Loads config and resolves the scan target for `audit imports`.
 *
 * @remarks Defaults to the repo root: the import policy is repo-wide, and generated or vendored
 * trees are already excluded by the shared walk.
 *
 * @since 0.10.0
 */
export async function prepareImportsAudit(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<AuditCommandPrelude, AppError>> {
  return prepareRepoRootAudit(fs, args, (config) => config.audit?.imports?.allowlist ?? []);
}
