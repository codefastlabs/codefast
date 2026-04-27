import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { MirrorSyncReporterPort } from "#/lib/mirror/application/ports/mirror-sync-reporter.port";
import type { MirrorSyncRunRequest } from "#/lib/mirror/application/requests/mirror-sync.request";
import type { SyncWorkspacePackageService } from "#/lib/mirror/application/ports/sync-workspace-package.port";
import { RunMirrorSyncUseCaseImpl } from "#/lib/mirror/application/use-cases/run-mirror-sync.use-case";

function minimalRequest(overrides: Partial<MirrorSyncRunRequest> = {}): MirrorSyncRunRequest {
  return {
    rootDir: "/repo",
    ...overrides,
  };
}

describe("runMirrorSync use case", () => {
  it("returns INFRA_FAILURE when workspace resolution throws inside the sync try block", async () => {
    const syncExportsForWorkspacePackage = vi.fn();
    const syncWorkspacePackage: SyncWorkspacePackageService = {
      syncExportsForWorkspacePackage,
    };
    const subject = new RunMirrorSyncUseCaseImpl(
      {} as CliFs,
      {
        out: vi.fn(),
        err: vi.fn(),
      },
      {
        resolvePackageFilterUnderRoot: vi.fn(() => {
          throw new Error("resolve failed");
        }),
        findWorkspacePackageRelPaths: vi.fn(),
      },
      {
        configureMirrorColors: vi.fn(),
        mirrorBanner: vi.fn(),
        mirrorProcessingMode: vi.fn(),
        mirrorNoPackages: vi.fn(),
        mirrorSummarySeparator: vi.fn(),
        mirrorSummary: vi.fn(),
      } as unknown as MirrorSyncReporterPort,
      syncWorkspacePackage,
    );
    const outcome = await subject.execute(
      minimalRequest({ packageFilter: "packages/x", config: {} }),
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      throw new Error("expected failure outcome");
    }
    expect(outcome.error.code).toBe("INFRA_FAILURE");
    expect(syncExportsForWorkspacePackage).not.toHaveBeenCalled();
  });
});
