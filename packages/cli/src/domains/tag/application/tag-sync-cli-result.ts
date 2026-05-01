import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/shell/domain/cli-exit-codes.domain";
import type { TagSyncResult } from "#/domains/tag/domain/types.domain";

/**
 * Exit code for `codefast tag` / `annotate`, aligned with {@link PresentTagSyncResultPresenterImpl.present}
 * (empty workspace, run errors, or hook failure → non-zero).
 */
export function exitCodeForTagSyncResult(result: TagSyncResult): number {
  if (result.selectedTargets.length === 0) {
    return CLI_EXIT_GENERAL_ERROR;
  }
  const hasRunErrors = result.targetResults.some((targetResult) => targetResult.runError !== null);
  return hasRunErrors || result.hookError !== null ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}
