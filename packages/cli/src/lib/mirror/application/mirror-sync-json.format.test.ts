import { describe, expect, it } from "vitest";
import { formatMirrorSyncJsonOutput } from "#/lib/mirror/application/mirror-sync-json.format";
import type { GlobalStats } from "#/lib/mirror/domain/types.domain";

describe("formatMirrorSyncJsonOutput", () => {
  it("emits schemaVersion 1 and ok from packagesErrored", () => {
    const stats: GlobalStats = {
      packagesFound: 1,
      packagesProcessed: 1,
      packagesSkipped: 0,
      packagesErrored: 0,
      totalExports: 3,
      totalJsModules: 1,
      totalCssExports: 0,
      packageDetails: [],
    };
    const line = formatMirrorSyncJsonOutput(stats, 0.5);
    const parsed = JSON.parse(line) as {
      schemaVersion: number;
      ok: boolean;
      elapsedSeconds: number;
      stats: GlobalStats;
    };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.ok).toBe(true);
    expect(parsed.elapsedSeconds).toBe(0.5);
    expect(parsed.stats.packagesErrored).toBe(0);
  });

  it("sets ok false when packages errored", () => {
    const stats: GlobalStats = {
      packagesFound: 1,
      packagesProcessed: 0,
      packagesSkipped: 0,
      packagesErrored: 1,
      totalExports: 0,
      totalJsModules: 0,
      totalCssExports: 0,
      packageDetails: [],
    };
    const parsed = JSON.parse(formatMirrorSyncJsonOutput(stats, 0)) as { ok: boolean };
    expect(parsed.ok).toBe(false);
  });
});
