import type { AuditCommandPrelude } from "#audit/prepare";
import { prepareRepoRootAudit } from "#audit/prepare";
import type { AppError } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";

/**
 * Loads config and resolves the scan target for `audit assertions`.
 *
 * @remarks Defaults to the repo root, tests included: a double assertion in a test silences the
 * compiler on the code the test is meant to hold to its types.
 */
export async function prepareAssertionAudit(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<AuditCommandPrelude, AppError>> {
  return prepareRepoRootAudit(fs, args, (config) => config.audit?.assertions?.allowlist ?? []);
}
