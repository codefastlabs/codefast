import type { TagResolvedTarget, TagResult } from "#tag/domain/types";

/**
 * The one target a {@link createTagResult} run covers: an explicit path under `/repo`.
 */
export const explicitTagTarget: TagResolvedTarget = {
  targetPath: "/repo/src",
  rootRelativeTargetPath: "src",
  source: "explicit-target",
  packageDir: null,
  packageName: null,
};

/**
 * Builds a clean, applied tag run over {@link explicitTagTarget}, with the given fields replaced.
 */
export function createTagResult(overrides: Partial<TagResult> = {}): TagResult {
  return {
    mode: "applied",
    selectedTargets: [explicitTagTarget],
    skippedPackages: [],
    targetResults: [
      {
        target: explicitTagTarget,
        targetExists: true,
        runError: null,
        result: { version: "1.2.0", filesScanned: 1, filesChanged: 0, taggedDeclarations: 0, fileResults: [] },
      },
    ],
    filesScanned: 1,
    filesChanged: 0,
    taggedDeclarations: 0,
    blockedDeclarations: [],
    versionSummary: "1.2.0",
    distinctVersions: ["1.2.0"],
    modifiedFiles: [],
    hookError: null,
    ...overrides,
  };
}
