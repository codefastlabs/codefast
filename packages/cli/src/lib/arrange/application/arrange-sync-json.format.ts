import type { ArrangeRunResult } from "#/lib/arrange/domain/types.domain";

export type ArrangeSyncJsonPayloadV1 = {
  readonly schemaVersion: 1;
  /**
   * `true` when no `onAfterWrite` hook failure.
   */
  readonly ok: boolean;
  readonly write: boolean;
  readonly result: ArrangeRunResult;
};

export function formatArrangeSyncJsonOutput(result: ArrangeRunResult, write: boolean): string {
  const payload: ArrangeSyncJsonPayloadV1 = {
    schemaVersion: 1,
    ok: result.hookError === null,
    write,
    result,
  };
  return JSON.stringify(payload);
}
