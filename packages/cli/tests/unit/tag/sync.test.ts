import { describe, expect, it } from "vitest";

import type { TagTargetCandidate } from "#/tag/domain/types";
import { filterSkippedCandidates } from "#/tag/sync";

function workspaceCandidate(packageName: string): TagTargetCandidate {
  const packageDir = `/repo/${packageName}`;
  return {
    candidatePath: packageDir,
    rootRelativeCandidatePath: packageName,
    source: "workspace-package",
    packageDir,
    packageName,
  };
}

describe("filterSkippedCandidates", () => {
  const candidates = [
    workspaceCandidate("@apps/web"),
    workspaceCandidate("@apps/start-demo"),
    workspaceCandidate("@codefast/ui"),
  ];

  it("includes every candidate when no skip patterns are configured", () => {
    for (const skipPackages of [undefined, []]) {
      const { includedCandidates, skippedPackages } = filterSkippedCandidates(candidates, skipPackages);
      expect(includedCandidates).toHaveLength(3);
      expect(skippedPackages).toEqual([]);
    }
  });

  it("skips every package matching a scope glob and keeps the rest", () => {
    const { includedCandidates, skippedPackages } = filterSkippedCandidates(candidates, ["@apps/*"]);
    expect(skippedPackages).toEqual(["@apps/web", "@apps/start-demo"]);
    expect(includedCandidates.map((candidate) => candidate.packageName)).toEqual(["@codefast/ui"]);
  });

  it("still matches exact package names (backward compatible)", () => {
    const { skippedPackages } = filterSkippedCandidates(candidates, ["@apps/web"]);
    expect(skippedPackages).toEqual(["@apps/web"]);
  });

  it("never skips a candidate without a package name", () => {
    const explicitTarget: TagTargetCandidate = {
      candidatePath: "/repo/some/dir",
      rootRelativeCandidatePath: "some/dir",
      source: "explicit-target",
      packageDir: null,
      packageName: null,
    };
    const { includedCandidates, skippedPackages } = filterSkippedCandidates([explicitTarget], ["*"]);
    expect(includedCandidates).toEqual([explicitTarget]);
    expect(skippedPackages).toEqual([]);
  });
});
