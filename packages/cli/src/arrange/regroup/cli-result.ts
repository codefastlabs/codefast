import type { ArrangeRunResult } from "#/arrange/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";

/**
 * Machine-readable `arrange` sync summary for `--json`, minus the non-serializable preview plans.
 */
export function formatArrangeSyncJsonOutput(result: ArrangeRunResult, write: boolean): string {
  const { previewPlans: _plans, ...serializableResult } = result;
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.hookError === null,
    write,
    result: serializableResult,
  });
}

/**
 * Exit `1` when an after-write hook failed, `0` otherwise.
 */
export function exitCodeForArrangeSyncResult(result: ArrangeRunResult): number {
  return result.hookError !== null ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}
