import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import type { FileSystemServicePort } from "#/lib/mirror/application/ports/file-system-service.port";
import type { MirrorSyncReporterPort } from "#/lib/mirror/application/ports/mirror-sync-reporter.port";
import type { PackageRepositoryPort } from "#/lib/mirror/application/ports/package-repository.port";
import { SyncWorkspacePackageServiceImpl } from "./sync-workspace-package.service";
import type { GlobalStats } from "#/lib/mirror/domain/types.domain";

describe("SyncWorkspacePackageServiceImpl", () => {
  it("records skip stats when package.json is missing", async () => {
    const logSkippedWorkspacePackage = vi.fn();
    const subject = new SyncWorkspacePackageServiceImpl(
      {
        existsSync: vi.fn((checkPath: string) => !checkPath.endsWith("package.json")),
        readFile: vi.fn(),
      } as unknown as CliFs,
      {
        resolve: (_rootDir: string, relPath: string) => `/root/${relPath}`,
        join: (...pathSegments: string[]) => pathSegments.join("/"),
        basename: (absolutePath: string) => absolutePath.split("/").pop() ?? absolutePath,
      } as CliPath,
      {} as PackageRepositoryPort,
      {} as FileSystemServicePort,
      {
        out: vi.fn(),
        err: vi.fn(),
      } as CliLogger,
      {
        logSkippedWorkspacePackage,
      } as unknown as MirrorSyncReporterPort,
    );
    const stats: GlobalStats = {
      packagesFound: 1,
      packagesProcessed: 0,
      packagesSkipped: 0,
      packagesErrored: 0,
      totalExports: 0,
      totalJsModules: 0,
      totalCssExports: 0,
      packageDetails: [],
    };
    const pkgStats = await subject.syncExportsForWorkspacePackage(
      "/root",
      "packages/x",
      1,
      1,
      {},
      false,
      stats,
    );
    expect(pkgStats.skipped).toBe(true);
    expect(pkgStats.skipReason).toBe("package.json not found");
    expect(stats.packagesSkipped).toBe(1);
    expect(logSkippedWorkspacePackage).toHaveBeenCalled();
  });
});
