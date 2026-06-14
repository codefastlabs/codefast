import type { ArrangeSuggestGroupsRequest } from "#/arrange/cli-schema";
import { suggestCnGroups, summarizeGroupBucketLabels } from "#/arrange/domain/grouping";
import { formatArray, formatCnCall } from "#/arrange/domain/source-text-formatters";
import type { ArrangeSuggestGroupsOutput } from "#/arrange/domain/types";

/**
 * @since 0.3.16-canary.0
 */
export function suggestCnGroupsFromCli(request: ArrangeSuggestGroupsRequest): ArrangeSuggestGroupsOutput {
  const groups = suggestCnGroups(request.inlineClasses);
  const primaryLine = request.emitTvStyleArray
    ? formatArray(groups)
    : formatCnCall(groups, { trailingClassName: request.trailingClassName });
  const bucketsCommentLine = `// Buckets: ${JSON.stringify(summarizeGroupBucketLabels(groups))}`;
  return { primaryLine, bucketsCommentLine };
}
