import type { ArrangeSuggestGroupsOutput } from "#/arrange/domain/types";

/**
 * Machine-readable `arrange group` suggestion for `--json`.
 */
export function formatArrangeGroupJsonOutput(output: ArrangeSuggestGroupsOutput): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    primaryLine: output.primaryLine,
    bucketsCommentLine: output.bucketsCommentLine,
  });
}
