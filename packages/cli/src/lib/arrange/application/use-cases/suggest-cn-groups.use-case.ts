import { inject, injectable } from "@codefast/di";
import type { ArrangeSuggestGroupsRequest } from "#/lib/arrange/application/requests/suggest-groups.request";
import type { ArrangeSuggestGroupsOutput } from "#/lib/arrange/contracts/models";
import type { TailwindGroupingService } from "#/lib/arrange/domain/tailwind-grouping.service";
import { TailwindGroupingServiceToken } from "#/lib/arrange/contracts/tokens";
import { formatArray, formatCnCall } from "#/lib/arrange/domain/source-text-formatters.formatter";

export interface SuggestCnGroupsUseCase {
  execute(request: ArrangeSuggestGroupsRequest): ArrangeSuggestGroupsOutput;
}

@injectable([inject(TailwindGroupingServiceToken)])
export class SuggestCnGroupsUseCaseImpl implements SuggestCnGroupsUseCase {
  constructor(private readonly grouping: TailwindGroupingService) {}

  execute(request: ArrangeSuggestGroupsRequest): ArrangeSuggestGroupsOutput {
    const groups = this.grouping.suggestGroups(request.inlineClasses);
    const primaryLine = request.emitTvStyleArray
      ? formatArray(groups)
      : formatCnCall(groups, { trailingClassName: request.trailingClassName });
    const bucketsCommentLine = `// Buckets: ${JSON.stringify(this.grouping.summarizeBucketLabels(groups))}`;
    return { primaryLine, bucketsCommentLine };
  }
}
