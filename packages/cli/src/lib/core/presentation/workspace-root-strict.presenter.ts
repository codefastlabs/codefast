import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message.util";
import { appError, type AppError } from "#lib/core/domain/errors.domain";
import { err, ok, type Result } from "#lib/core/domain/result.model";
import type { CliContainer } from "#lib/core/infra/container.adapter";
import { findRepoRoot } from "#lib/infra/workspace/repo-root.adapter";

export function resolveCliWorkspaceRootStrict(cli: CliContainer): Result<string, AppError> {
  try {
    return ok(findRepoRoot(cli.fs));
  } catch (caughtError: unknown) {
    return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
  }
}
