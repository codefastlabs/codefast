import type { TagTargetCandidate } from "#/domains/tag/domain/types.domain";

/** Scans workspace package layout to propose concrete targets eligible for tagging. */
export interface TagEligibleWorkspacePathsPort {
  resolveTagTargetCandidates(
    rootDir: string,
    explicitTarget: string | undefined,
  ): Promise<TagTargetCandidate[]>;
}
