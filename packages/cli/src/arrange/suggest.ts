import type { ArrangeSuggestGroupsRequest } from "#/arrange/cli-schema";
import type { ArrangeSuggestGroupsOutput } from "#/arrange/domain/types.domain";
import { formatArray, formatCnCall } from "#/arrange/domain/source-text-formatters.formatter";
import { suggestCnGroups, summarizeGroupBucketLabels } from "#/arrange/domain/grouping.domain";

export function suggestCnGroupsFromCli(
  request: ArrangeSuggestGroupsRequest,
): ArrangeSuggestGroupsOutput {
  const groups = suggestCnGroups(request.inlineClasses);
  const primaryLine = request.emitTvStyleArray
    ? formatArray(groups)
    : formatCnCall(groups, { trailingClassName: request.trailingClassName });
  const bucketsCommentLine = `// Buckets: ${JSON.stringify(summarizeGroupBucketLabels(groups))}`;
  return { primaryLine, bucketsCommentLine };
}
