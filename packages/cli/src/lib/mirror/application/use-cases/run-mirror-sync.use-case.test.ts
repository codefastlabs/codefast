import type { CliFs } from "#lib/core/application/ports/cli-io.port";
import { nodeCliPath } from "#lib/core/infra/path.adapter";
import type { MirrorSyncRunRequest } from "#lib/mirror/application/requests/mirror-sync.request";
import {
  runMirrorSync,
  type MirrorSyncRunDeps,
} from "#lib/mirror/application/use-cases/run-mirror-sync.use-case";

function minimalRequest(overrides: Partial<MirrorSyncRunRequest> = {}): MirrorSyncRunRequest {
  return {
    rootDir: "/repo",
    ...overrides,
  };
}

describe("runMirrorSync use case", () => {
  it("returns INFRA_FAILURE when workspace resolution throws inside the sync try block", async () => {
    const deps: MirrorSyncRunDeps = {
      fs: {} as CliFs,
      path: nodeCliPath,
      logger: { out: jest.fn(), err: jest.fn() },
      workspaceService: {
        resolvePackageFilterUnderRoot: jest.fn(() => {
          throw new Error("resolve failed");
        }),
        findWorkspacePackageRelPaths: jest.fn(),
      },
      packageRepository: {} as MirrorSyncRunDeps["packageRepository"],
      fileSystemService: {} as MirrorSyncRunDeps["fileSystemService"],
      mirrorReporter: {
        configureMirrorColors: jest.fn(),
        mirrorBanner: jest.fn(),
        mirrorProcessingMode: jest.fn(),
        mirrorNoPackages: jest.fn(),
        mirrorSummarySeparator: jest.fn(),
        mirrorSummary: jest.fn(),
      } as unknown as MirrorSyncRunDeps["mirrorReporter"],
    };
    const outcome = await runMirrorSync(
      minimalRequest({ packageFilter: "packages/x", config: {} }),
      deps,
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      throw new Error("expected failure outcome");
    }
    expect(outcome.error.code).toBe("INFRA_FAILURE");
  });
});
