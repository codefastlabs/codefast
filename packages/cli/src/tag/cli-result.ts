import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";
import type { TagSyncResult } from "#/tag/domain/types.domain";

export function exitCodeForTagSyncResult(result: TagSyncResult): number {
  if (result.selectedTargets.length === 0) {
    return CLI_EXIT_GENERAL_ERROR;
  }
  const hasRunErrors = result.targetResults.some((targetResult) => targetResult.runError !== null);
  return hasRunErrors || result.hookError !== null ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}
