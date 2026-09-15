import type { TagTargetExecutionResult } from "#/tag/domain/types";

/**
 * Collects the distinct, non-empty package versions stamped across a run's target results.
 *
 * @since 0.11.0
 */
export function extractDistinctVersions(targetResults: Array<TagTargetExecutionResult>): Set<string> {
  return new Set(
    targetResults
      .map((targetResult) => targetResult.result?.version)
      .filter((version): version is string => typeof version === "string" && version.length > 0),
  );
}

/**
 * Summarizes a set of versions as `"none"`, the single version, or `"mixed"`.
 *
 * @since 0.11.0
 */
export function summarizeVersions(distinctVersions: Set<string>): string {
  if (distinctVersions.size === 0) {
    return "none";
  }
  if (distinctVersions.size > 1) {
    return "mixed";
  }
  return distinctVersions.values().next().value ?? "none";
}
