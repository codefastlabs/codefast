import { createAnyGlobMatcher } from "#/core/glob";
import type { TagTargetCandidate } from "#/tag/domain/types";

/**
 * Partitions tag target candidates into those to tag and those to skip, matching each candidate's
 * package name against `skipPackages` as glob patterns.
 *
 * @remarks Candidates without a package name (e.g. an explicit-target path) are never skipped.
 *
 * @since 0.5.0-canary.0
 */
export function filterSkippedCandidates(
  targetCandidates: Array<TagTargetCandidate>,
  skipPackages: ReadonlyArray<string> | undefined,
): { includedCandidates: Array<TagTargetCandidate>; skippedPackages: Array<string> } {
  if (!skipPackages || skipPackages.length === 0) {
    return {
      includedCandidates: targetCandidates,
      skippedPackages: [],
    };
  }

  const isSkipped = createAnyGlobMatcher(skipPackages);
  const includedCandidates: Array<TagTargetCandidate> = [];
  const skippedPackages: Array<string> = [];
  for (const candidate of targetCandidates) {
    const packageName = candidate.packageName;
    if (packageName && isSkipped(packageName)) {
      skippedPackages.push(packageName);
      continue;
    }
    includedCandidates.push(candidate);
  }

  return { includedCandidates, skippedPackages };
}
