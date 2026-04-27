import { describe, expect, it } from "vitest";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/lib/core/domain/cli-exit-codes.domain";
import { exitCodeForTagSyncResult } from "#/lib/tag/application/tag-sync-cli-result";
import type { TagSyncResult } from "#/lib/tag/domain/types.domain";

function baseResult(overrides: Partial<TagSyncResult> = {}): TagSyncResult {
  return {
    mode: "applied",
    selectedTargets: [
      {
        targetPath: "/a",
        rootRelativeTargetPath: "a",
        source: "explicit-target",
        packageDir: null,
        packageName: null,
      },
    ],
    resolvedTargets: [],
    skippedPackages: [],
    targetResults: [],
    filesScanned: 0,
    filesChanged: 0,
    taggedDeclarations: 0,
    versionSummary: "single",
    distinctVersions: [],
    modifiedFiles: [],
    hookError: null,
    ...overrides,
  };
}

describe("exitCodeForTagSyncResult", () => {
  it("returns general error when no targets selected", () => {
    expect(exitCodeForTagSyncResult(baseResult({ selectedTargets: [] }))).toBe(
      CLI_EXIT_GENERAL_ERROR,
    );
  });

  it("returns success when targets ran without errors", () => {
    expect(exitCodeForTagSyncResult(baseResult())).toBe(CLI_EXIT_SUCCESS);
  });

  it("returns general error on run or hook failure", () => {
    expect(
      exitCodeForTagSyncResult(
        baseResult({
          targetResults: [
            {
              target: baseResult().selectedTargets[0]!,
              targetExists: true,
              runError: "x",
              result: null,
            },
          ],
        }),
      ),
    ).toBe(CLI_EXIT_GENERAL_ERROR);
    expect(exitCodeForTagSyncResult(baseResult({ hookError: "h" }))).toBe(CLI_EXIT_GENERAL_ERROR);
  });
});
