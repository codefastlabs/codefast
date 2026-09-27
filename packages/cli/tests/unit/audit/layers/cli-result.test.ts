import { describe, expect, it } from "vitest";

import type { LayersAuditResult } from "#audit/domain/types";
import { exitCodeForLayersAuditResult, formatLayersAuditJsonOutput } from "#audit/layers/cli-result";

const clean: LayersAuditResult = {
  files: [],
  violationCount: 0,
  allowlistedCount: 0,
  scannedFileCount: 4,
  packageCount: 1,
};
const dirty: LayersAuditResult = {
  files: [{ relativePath: "a.ts", violations: [{ line: 1, raw: 'import "#engine/x";', reason: "points up" }] }],
  violationCount: 1,
  allowlistedCount: 0,
  scannedFileCount: 4,
  packageCount: 1,
};

describe("layers cli-result", () => {
  it("exits 0 when clean and 1 when violations remain", () => {
    expect(exitCodeForLayersAuditResult(clean)).toBe(0);
    expect(exitCodeForLayersAuditResult(dirty)).toBe(1);
  });

  it("serializes a machine summary carrying ok and cwd", () => {
    expect(JSON.parse(formatLayersAuditJsonOutput(dirty, "/repo"))).toMatchObject({
      schemaVersion: 1,
      ok: false,
      cwd: "/repo",
      result: { violationCount: 1, packageCount: 1 },
    });
    expect(JSON.parse(formatLayersAuditJsonOutput(clean, "/repo")).ok).toBe(true);
  });
});
