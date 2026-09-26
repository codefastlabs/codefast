import { describe, expect, it } from "vitest";

import type { PublishAuditResult } from "#audit/domain/types";
import { exitCodeForPublishAuditResult, formatPublishAuditJsonOutput } from "#audit/publish/cli-result";

const clean: PublishAuditResult = {
  legacyImportFiles: [],
  unshipped: [],
  unreachableStylesheets: [],
  legacyImportCount: 0,
  scannedFileCount: 10,
  packageCount: 3,
};

const withUnreachableStylesheet: PublishAuditResult = {
  ...clean,
  unreachableStylesheets: [
    {
      packageName: "@x/y",
      stylesheet: "packages/y/src/css/source.css",
      sources: [{ line: 1, pattern: "../**/*.tsx" }],
      missingFilesEntries: [],
    },
  ],
};

describe("exitCodeForPublishAuditResult", () => {
  it("exits 0 when nothing is flagged", () => {
    expect(exitCodeForPublishAuditResult(clean)).toBe(0);
  });

  it("exits 1 on a legacy #/ import", () => {
    expect(exitCodeForPublishAuditResult({ ...clean, legacyImportCount: 1 })).toBe(1);
  });

  it("exits 1 on an unshipped target", () => {
    const result: PublishAuditResult = {
      ...clean,
      unshipped: [{ packageName: "@x/y", field: "exports", subpath: "./css/*", target: "./src/css/*" }],
    };
    expect(exitCodeForPublishAuditResult(result)).toBe(1);
  });

  it("exits 1 on a stylesheet whose sources reach nothing shipped", () => {
    expect(exitCodeForPublishAuditResult(withUnreachableStylesheet)).toBe(1);
  });
});

describe("formatPublishAuditJsonOutput", () => {
  it("reports ok and echoes the cwd", () => {
    const parsed = JSON.parse(formatPublishAuditJsonOutput(clean, "/repo")) as Record<string, unknown>;
    expect(parsed).toMatchObject({ schemaVersion: 1, ok: true, cwd: "/repo" });
  });

  it("reports not ok on a stylesheet whose sources reach nothing shipped", () => {
    const parsed = JSON.parse(formatPublishAuditJsonOutput(withUnreachableStylesheet, "/repo")) as Record<
      string,
      unknown
    >;
    expect(parsed).toMatchObject({ ok: false });
  });
});
