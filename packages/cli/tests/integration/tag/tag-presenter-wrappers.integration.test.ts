import { exitCodeForTagSyncResult } from "#/domains/tag/application/tag-sync-cli-result";
import { PresentTagSyncResultPresenter } from "#/domains/tag/presentation/presenters/present-tag-sync-result.presenter";
import { PresentTagSyncProgressPresenter } from "#/domains/tag/presentation/presenters/present-tag-sync-progress.presenter";

function createResult() {
  return {
    mode: "applied",
    selectedTargets: [
      {
        targetPath: "/tmp/workspace/packages/a/src",
        rootRelativeTargetPath: "packages/a/src",
        source: "workspace-package-selected-src",
        packageDir: "/tmp/workspace/packages/a",
        packageName: "@scope/a",
      },
    ],
    resolvedTargets: [],
    skippedPackages: [],
    targetResults: [
      {
        target: {
          targetPath: "/tmp/workspace/packages/a/src",
          rootRelativeTargetPath: "packages/a/src",
          source: "workspace-package-selected-src",
          packageDir: "/tmp/workspace/packages/a",
          packageName: "@scope/a",
        },
        targetExists: true,
        runError: null,
        result: {
          version: "1.0.0",
          filesScanned: 1,
          filesChanged: 1,
          taggedDeclarations: 1,
          fileResults: [],
        },
      },
    ],
    filesScanned: 1,
    filesChanged: 1,
    taggedDeclarations: 1,
    versionSummary: "1.0.0",
    distinctVersions: ["1.0.0"],
    modifiedFiles: [],
    hookError: null,
  };
}

describe("tag presenter wrappers integration", () => {
  it("delegates final result presentation", () => {
    const logger = { out: vi.fn(), err: vi.fn() };
    const presenter = new PresentTagSyncResultPresenter(logger);
    const result = createResult();
    const expected = exitCodeForTagSyncResult(result as never);
    const actual = presenter.present(result as never, "/tmp/workspace");
    expect(actual).toBe(expected);
  });

  it("emits target started/completed logs via progress listener", () => {
    const logger = { out: vi.fn(), err: vi.fn() };
    const listener = new PresentTagSyncProgressPresenter(logger);
    const result = createResult();
    const target = result.selectedTargets[0] as never;
    const executionResult = result.targetResults[0] as never;

    listener.onTargetStarted(target);
    listener.onTargetCompleted(target, executionResult);

    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("Processing @scope/a"));
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("Done @scope/a"));
  });
});
