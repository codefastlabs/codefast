import type { ArrangeRunResult } from "#/arrange/domain/types";

/**
 * Machine-readable `arrange simplify` summary for `--json`.
 */
export function formatArrangeSimplifyJsonOutput(result: ArrangeRunResult, write: boolean): string {
  return JSON.stringify({ schemaVersion: 1 as const, ok: true, write, result });
}
