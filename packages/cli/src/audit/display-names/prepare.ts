import type { AuditCommandPrelude } from "#/audit/prepare";
import { prepareRepoRootAudit } from "#/audit/prepare";
import type { AppError } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";

/**
 * Loads config and resolves the scan target for `audit display-names`.
 *
 * @remarks Defaults to the repo root: a display name collides across packages, so the convention
 * has to hold across them.
 *
 * @since 0.9.0
 */
export async function prepareDisplayNameAudit(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<AuditCommandPrelude, AppError>> {
  return prepareRepoRootAudit(fs, args, (config) => config.audit?.displayNames?.allowlist ?? []);
}
