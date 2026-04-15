import type { GlobalStats, MirrorPackageMeta } from "#lib/mirror/domain/types.domain";

describe("mirror domain types", () => {
  it("supports GlobalStats initialization", () => {
    const stats: GlobalStats = {
      packagesFound: 0,
      packagesProcessed: 0,
      packagesSkipped: 0,
      packagesErrored: 0,
      totalExports: 0,
      totalJsModules: 0,
      totalCssExports: 0,
      packageDetails: [],
    };
    expect(stats.packagesFound).toBe(0);
  });

  it("supports MirrorPackageMeta", () => {
    const meta: MirrorPackageMeta = { packageName: "@acme/pkg" };
    expect(meta.packageName).toBe("@acme/pkg");
  });
});
