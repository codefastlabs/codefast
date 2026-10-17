import { describe, expect, it } from "vitest";

import type { EnginesAuditResult } from "#audit/domain/types";
import { exitCodeForEnginesAuditResult, formatEnginesAuditJsonOutput } from "#audit/engines/cli-result";

const clean: EnginesAuditResult = {
  floors: [{ packageName: "@x/a", directory: "packages/a", floor: "24.0.0" }],
  violations: [],
  packageCount: 1,
};

const violated: EnginesAuditResult = {
  ...clean,
  violations: [{ kind: "missing-floor", packageName: "@x/b" }],
};

describe("exitCodeForEnginesAuditResult", () => {
  it("exits 0 when every floor holds", () => {
    expect(exitCodeForEnginesAuditResult(clean)).toBe(0);
  });

  it("exits 1 when a violation remains", () => {
    expect(exitCodeForEnginesAuditResult(violated)).toBe(1);
  });
});

describe("formatEnginesAuditJsonOutput", () => {
  it("carries the floors CI plans its legs from", () => {
    expect(JSON.parse(formatEnginesAuditJsonOutput(clean, "/repo"))).toEqual({
      schemaVersion: 1,
      ok: true,
      cwd: "/repo",
      result: clean,
    });
  });

  it("carries the releases a dependency's engines leave out", () => {
    const violation = {
      kind: "outside-dependency-engines",
      packageName: "@x/c",
      floor: "22.18.0",
      dependency: "@babel/core",
      field: "dependencies",
      range: "^22.18.0 || >=24.11.0",
      uncovered: ">=24.0.0 <24.11.0",
    } as const;

    const output = JSON.parse(formatEnginesAuditJsonOutput({ ...clean, violations: [violation] }, "/repo"));

    expect(output.result.violations).toEqual([violation]);
  });

  it("reports ok false when a violation remains", () => {
    expect(JSON.parse(formatEnginesAuditJsonOutput(violated, "/repo")).ok).toBe(false);
  });
});
