import type { ArrangeSuggestGroupsOutput } from "#/arrange/domain/types";

/**
 * Machine-readable `arrange group` suggestion for `--json`.
 *
 * @since 0.11.0
 */
export function formatArrangeGroupJsonOutput(output: ArrangeSuggestGroupsOutput): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    primaryLine: output.primaryLine,
    bucketsCommentLine: output.bucketsCommentLine,
  });
}
