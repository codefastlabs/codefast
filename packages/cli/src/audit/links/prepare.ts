import type { AuditCommandPrelude } from "#/audit/prepare";
import { prepareRepoRootAudit } from "#/audit/prepare";
import type { AppError } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";

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
): Promise<Result<AuditCommandPrelude, AppError>> {
  return prepareRepoRootAudit(fs, args, (config) => config.audit?.links?.allowlist ?? []);
}
