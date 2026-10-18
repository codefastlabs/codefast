import type { AuditCommandPrelude } from "#audit/prepare";
import { prepareRepoRootAudit } from "#audit/prepare";
import type { AppError } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";

/**
 * Loads config and resolves the scan target for `audit props`, defaulting to the repo root.
 *
 * @since 0.15.0
 */
export async function preparePropsAudit(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<AuditCommandPrelude, AppError>> {
  return prepareRepoRootAudit(fs, args, (config) => config.audit?.props?.allowlist ?? []);
}
