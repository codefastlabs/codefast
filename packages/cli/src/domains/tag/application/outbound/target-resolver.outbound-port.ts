import type { TagTargetCandidate } from "#/domains/tag/domain/types.domain";

export interface TagTargetResolverPort {
  resolveTagTargetCandidates(
    rootDir: string,
    explicitTarget: string | undefined,
  ): Promise<TagTargetCandidate[]>;
}
