import { CLI_EXIT_SUCCESS } from "#/lib/core/domain/cli-exit-codes.domain";
import type { TagSyncResult } from "#/lib/tag/domain/types.domain";
import { exitCodeForTagSyncResult } from "#/lib/tag/application/tag-sync-cli-result";

export type TagSyncJsonPayloadV1 = {
  readonly schemaVersion: 1;
  /** `true` when {@link exitCodeForTagSyncResult} would be success. */
  readonly ok: boolean;
  readonly rootDir: string;
  readonly result: TagSyncResult;
};

export function formatTagSyncJsonOutput(tagResult: TagSyncResult, rootDir: string): string {
  const payload: TagSyncJsonPayloadV1 = {
    schemaVersion: 1,
    ok: exitCodeForTagSyncResult(tagResult) === CLI_EXIT_SUCCESS,
    rootDir,
    result: tagResult,
  };
  return JSON.stringify(payload);
}
