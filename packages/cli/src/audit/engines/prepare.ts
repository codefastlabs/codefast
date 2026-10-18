import type { AuditCommandPrelude } from "#audit/prepare";
import { prepareRepoRootAudit } from "#audit/prepare";
import type { AppError } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";

/**
 * Loads config and resolves the scan target for `audit engines`.
 *
 * @remarks Defaults to the repo root. A narrower target checks only the packages it reaches, still against the floors
 * of every workspace package they depend on. It takes no allowlist.
 *
 * @since 0.15.0
 */
export async function prepareEnginesAudit(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<AuditCommandPrelude, AppError>> {
  return prepareRepoRootAudit(fs, args, () => []);
}
