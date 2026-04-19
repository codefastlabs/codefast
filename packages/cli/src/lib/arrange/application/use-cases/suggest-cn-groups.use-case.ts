import { injectable } from "@codefast/di";
import type { ArrangeSuggestGroupsRequest } from "#/lib/arrange/application/requests/suggest-groups.request";
import type { ArrangeSuggestGroupsOutput } from "#/lib/arrange/contracts/models";
import type { SuggestCnGroupsUseCase } from "#/lib/arrange/contracts/use-cases.contract";
import { suggestCnGroups, summarizeGroupBucketLabels } from "#/lib/arrange/domain/grouping.domain";
import { formatArray, formatCnCall } from "#/lib/arrange/domain/source-text-formatters.formatter";

@injectable([])
export class SuggestCnGroupsUseCaseImpl implements SuggestCnGroupsUseCase {
  execute(request: ArrangeSuggestGroupsRequest): ArrangeSuggestGroupsOutput {
    const groups = suggestCnGroups(request.inlineClasses);
    const primaryLine = request.emitTvStyleArray
      ? formatArray(groups)
      : formatCnCall(groups, { trailingClassName: request.trailingClassName });
    const bucketsCommentLine = `// Buckets: ${JSON.stringify(summarizeGroupBucketLabels(groups))}`;
    return { primaryLine, bucketsCommentLine };
  }
}
