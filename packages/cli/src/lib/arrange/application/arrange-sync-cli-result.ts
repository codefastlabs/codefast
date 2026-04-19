import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/lib/core/domain/cli-exit-codes.domain";
import type { ArrangeRunResult } from "#/lib/arrange/domain/types.domain";

export function exitCodeForArrangeSyncResult(result: ArrangeRunResult): number {
  return result.hookError !== null ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}
