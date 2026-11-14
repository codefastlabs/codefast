import { afterEach, describe, expect, it, vi } from "vitest";

import type { PackageOutcome } from "#core/report";
import {
  countPackageOutcomes,
  packagesVerdict,
  presentFindings,
  presentPackageOutcomes,
  presentSummary,
  writtenPackageFiles,
} from "#core/report";
import { refuseColor } from "#core/style";
import { captureLogger } from "#tests/unit/support/logger-capture";

afterEach(() => {
  refuseColor(false);
  vi.restoreAllMocks();
});

const outcome = (name: string, status: PackageOutcome["status"], files: Array<string> = []): PackageOutcome => ({
  name,
  directory: `packages/${name}`,
  status,
  reason: status === "skipped" ? "skipped by the config" : null,
  files,
});

describe("presenters", () => {
  it("groups findings under their file and clips long text", () => {
    refuseColor(true);
    const printed = captureLogger();

    presentFindings([
      { file: "a.ts", line: 3, text: "x".repeat(100), message: "too long" },
      { file: "a.ts", line: 9, text: "y", message: "again" },
      { file: "b.ts", line: 1, text: "z", message: "other" },
    ]);

    expect(printed.out()).toBe(
      ["\na.ts", `  3: ${"x".repeat(79)}… → too long`, "  9: y → again", "\nb.ts", "  1: z → other"].join("\n"),
    );
  });

  it("prints one row per package, its reason standing in for the detail", () => {
    refuseColor(true);
    const printed = captureLogger();

    presentPackageOutcomes([outcome("di", "changed"), outcome("apps", "skipped")], () => "3 exports");

    expect(printed.out()).toBe(["✎ di    3 exports", "○ apps  skipped by the config"].join("\n"));
  });

  it("ends with one summary line carrying the elapsed time", () => {
    refuseColor(true);
    const printed = captureLogger();

    presentSummary(false, "audit:links: 2 findings", 0.5);

    expect(printed.out()).toBe("\n✗ audit:links: 2 findings (0.50s)");
  });
});

describe("package outcome helpers", () => {
  const outcomes = [
    outcome("di", "changed", ["packages/di/package.json"]),
    outcome("ui", "failed"),
    outcome("x", "skipped"),
  ];

  it("counts outcomes by status, failures first", () => {
    expect(countPackageOutcomes(outcomes)).toBe("1 failed, 1 changed, 1 skipped");
    expect(countPackageOutcomes([])).toBe("no packages");
  });

  it("fails a writing command when any package failed", () => {
    expect(packagesVerdict(outcomes)).toBe("fail");
    expect(packagesVerdict([outcome("di", "unchanged")])).toBe("pass");
  });

  it("lists the absolute files written, none on a dry run", () => {
    expect(writtenPackageFiles(outcomes, "/repo", false)).toEqual(["/repo/packages/di/package.json"]);
    expect(writtenPackageFiles(outcomes, "/repo", true)).toEqual([]);
  });
});
