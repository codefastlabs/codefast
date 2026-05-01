import { inject, injectable } from "@codefast/di";
import type { ArrangeSuggestGroupsRequest } from "#/domains/arrange/application/requests/suggest-groups.request";
import type { ArrangeSuggestGroupsOutput } from "#/domains/arrange/contracts/models";
import type { TailwindGroupingService } from "#/domains/arrange/domain/tailwind-grouping.service";
import { TailwindGroupingServiceToken } from "#/domains/arrange/contracts/tokens";
import {
  formatArray,
  formatCnCall,
} from "#/domains/arrange/domain/source-text-formatters.formatter";
import type { SuggestCnGroupsUseCase } from "#/domains/arrange/application/inbound/suggest-cn-groups.use-case";

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
