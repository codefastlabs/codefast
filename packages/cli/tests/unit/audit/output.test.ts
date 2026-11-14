import { afterEach, describe, expect, it, vi } from "vitest";

import type { AuditReport } from "#audit/domain/types";
import { describeAuditReport, presentAuditAll, presentAuditReport } from "#audit/output";
import { refuseColor } from "#core/style";
import { captureLogger } from "#tests/unit/support/logger-capture";

afterEach(() => {
  refuseColor(false);
  vi.restoreAllMocks();
});

const report = (overrides: Partial<AuditReport> = {}): AuditReport => ({
  findings: [],
  scannedFiles: 12,
  scannedPackages: 0,
  fixedFiles: [],
  allowlisted: 0,
  ...overrides,
});

const finding = { file: "a.ts", line: 3, text: "ml-2", message: "use ms-2" };

describe("describeAuditReport", () => {
  it("says what the audit found and what it scanned, files or packages or both", () => {
    expect(describeAuditReport(report())).toBe("no findings in 12 files");
    expect(describeAuditReport(report({ scannedFiles: 0, scannedPackages: 1 }))).toBe("no findings in 1 package");
    expect(describeAuditReport(report({ scannedPackages: 3, findings: [finding] }))).toBe(
      "1 finding in 12 files and 3 packages",
    );
  });

  it("adds what the allowlist accepted and what --fix rewrote", () => {
    expect(describeAuditReport(report({ allowlisted: 2, fixedFiles: ["a.ts"] }))).toBe(
      "no findings in 12 files, 2 allowlisted, 1 file fixed",
    );
  });
});

describe("presentAuditReport", () => {
  it("prints the findings, then the summary line naming the audit", () => {
    refuseColor(true);
    const printed = captureLogger();

    presentAuditReport("rtl", report({ findings: [finding] }), 0.5);

    expect(printed.out()).toBe(
      ["\na.ts", "  3: ml-2 → use ms-2", "\n✗ audit:rtl: 1 finding in 12 files (0.50s)"].join("\n"),
    );
  });
});

describe("presentAuditAll", () => {
  it("prints one line per audit with its findings beneath, then names every audit that failed", () => {
    refuseColor(true);
    const printed = captureLogger();

    presentAuditAll(
      {
        audits: [
          { name: "links", status: "clean", result: report() },
          { name: "rtl", status: "findings", result: report({ findings: [finding] }) },
          { name: "props", status: "skipped", reason: "turned off in the config" },
          { name: "engines", status: "error", error: { code: "NOT_FOUND", message: "Not found" } },
        ],
      },
      0.5,
    );

    expect(printed.out()).toBe(
      [
        "✓ audit:links: no findings in 12 files",
        "✗ audit:rtl: 1 finding in 12 files",
        "\na.ts",
        "  3: ml-2 → use ms-2",
        "○ audit:props: turned off in the config",
        "✗ audit:engines: [NOT_FOUND] Not found",
        "\n✗ audit: 2 of 4 failed — rtl (findings), engines (error) (0.50s)",
      ].join("\n"),
    );
  });
});
