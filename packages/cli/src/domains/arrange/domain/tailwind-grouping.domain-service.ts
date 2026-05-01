import { injectable } from "@codefast/di";
import {
  suggestCnGroups,
  summarizeGroupBucketLabels,
} from "#/domains/arrange/domain/grouping.domain";

export interface TailwindGroupingService {
  suggestGroups(classString: string): string[];
  summarizeBucketLabels(groups: string[]): string[];
}

@injectable()
export class TailwindGroupingDomainService implements TailwindGroupingService {
  suggestGroups(classString: string): string[] {
    return suggestCnGroups(classString);
  }

  summarizeBucketLabels(groups: string[]): string[] {
    return summarizeGroupBucketLabels(groups);
  }
}
