import { afterEach, describe, expect, it, vi } from "vitest";

import type { LayersAuditResult } from "#audit/domain/types";
import { presentLayersAuditResult } from "#audit/layers/output";
import { logger } from "#core/logger";

function captureOut(run: () => void): string {
  const spy = vi.spyOn(logger, "out").mockImplementation(() => {});
  run();
  return spy.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("presentLayersAuditResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints each violation and a failing total", () => {
    const result: LayersAuditResult = {
      files: [
        {
          relativePath: "packages/di/src/core/binding.ts",
          violations: [{ line: 1, raw: 'import { resolve } from "#engine/resolver";', reason: "points up the layers" }],
        },
      ],
      violationCount: 1,
      allowlistedCount: 0,
      scannedFileCount: 4,
      packageCount: 1,
    };

    const out = captureOut(() => {
      presentLayersAuditResult(result);
    });

    expect(out).toContain("packages/di/src/core/binding.ts");
    expect(out).toContain("points up the layers");
    expect(out).toContain("✖ 1 layering violation(s)");
  });

  it("prints a clean summary naming the files and packages it read", () => {
    const out = captureOut(() => {
      presentLayersAuditResult({
        files: [],
        violationCount: 0,
        allowlistedCount: 0,
        scannedFileCount: 4,
        packageCount: 1,
      });
    });

    expect(out).toContain("✓ Every value import points down the layers across 4 file(s) in 1 package(s)");
  });
});
