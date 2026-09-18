import type { AuditCommandPrelude } from "#audit/prepare";
import { prepareRepoRootAudit } from "#audit/prepare";
import type { AppError } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";

/**
 * Loads config and resolves the scan target for `audit publish`.
 *
 * @remarks Defaults to the repo root: the audit walks every published package's source and manifest, so
 * a single-package target would miss the cross-package surface. It takes no allowlist.
 *
 * @since 0.12.0
 */
export async function preparePublishAudit(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<AuditCommandPrelude, AppError>> {
  return prepareRepoRootAudit(fs, args, () => []);
}
