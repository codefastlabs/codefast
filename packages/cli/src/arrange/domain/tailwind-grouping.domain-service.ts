import { suggestCnGroups, summarizeGroupBucketLabels } from "#/arrange/domain/grouping.domain";

export interface TailwindGroupingService {
  suggestGroups(classString: string): string[];
  summarizeBucketLabels(groups: string[]): string[];
}

export class TailwindGroupingDomainService implements TailwindGroupingService {
  suggestGroups(classString: string): string[] {
    return suggestCnGroups(classString);
  }

  summarizeBucketLabels(groups: string[]): string[] {
    return summarizeGroupBucketLabels(groups);
  }
}
