import type { ArrangeSuggestGroupsRequest } from "#lib/arrange/application/requests/suggest-groups.request";
import { suggestCnGroups, summarizeGroupBucketLabels } from "#lib/arrange/domain/grouping.domain";
import { formatArray, formatCnCall } from "#lib/arrange/domain/source-text-formatters.formatter";

export type ArrangeSuggestGroupsOutput = {
  readonly primaryLine: string;
  readonly bucketsCommentLine: string;
};

export function suggestCnGroupsForCli(
  request: ArrangeSuggestGroupsRequest,
): ArrangeSuggestGroupsOutput {
  const groups = suggestCnGroups(request.inlineClasses);
  const primaryLine = request.emitTvStyleArray
    ? formatArray(groups)
    : formatCnCall(groups, { trailingClassName: request.trailingClassName });
  const bucketsCommentLine = `// Buckets: ${JSON.stringify(summarizeGroupBucketLabels(groups))}`;
  return { primaryLine, bucketsCommentLine };
}
