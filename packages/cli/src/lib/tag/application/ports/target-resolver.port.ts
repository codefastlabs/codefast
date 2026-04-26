import type { TagTargetCandidate } from "#/lib/tag/domain/types.domain";

export interface TagTargetResolverPort {
  resolveTagTargetCandidates(
    rootDir: string,
    explicitTarget: string | undefined,
  ): Promise<TagTargetCandidate[]>;
}
