import type { AuditCommandPrelude } from "#/audit/prepare";
import { prepareRepoRootAudit } from "#/audit/prepare";
import type { AppError } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";

/**
 * Loads config and resolves the scan target for `audit comments`.
 *
 * @remarks Defaults to the repo root: a divider convention that only holds inside one package
 * is not a convention.
 *
 * @since 0.6.0
 */
export async function prepareCommentAudit(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<AuditCommandPrelude, AppError>> {
  return prepareRepoRootAudit(fs, args, (config) => config.audit?.comments?.allowlist ?? []);
}
