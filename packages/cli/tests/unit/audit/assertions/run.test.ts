import path from "node:path";

import { describe, expect, it } from "vitest";

import { runAssertionAudit } from "#audit/assertions/run";
import { createAuditTestFilesystem } from "#tests/unit/support/audit-test-filesystem";

describe("runAssertionAudit", () => {
  const rootDir = path.join(path.sep, "repo");
  const sourcePath = path.join(rootDir, "packages", "a", "src", "a.ts");
  const testPath = path.join(rootDir, "packages", "a", "tests", "unit", "a.test.ts");

  it("scans tests as well as source, and counts what it scanned", () => {
    const fs = createAuditTestFilesystem({
      [sourcePath]: "export const a = value as unknown as Target;\n",
      [testPath]: "const fake = {} as unknown as Service;\n",
    });

    const result = runAssertionAudit(fs, { rootDir, targetPath: rootDir, allowlist: [] });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.scannedFileCount).toBe(2);
    expect(result.value.violationCount).toBe(2);
    expect(result.value.files.map((file) => file.relativePath).toSorted()).toStrictEqual([
      "packages/a/src/a.ts",
      "packages/a/tests/unit/a.test.ts",
    ]);
  });

  it("drops a finding the config allowlists by its repo-relative path", () => {
    const fs = createAuditTestFilesystem({ [sourcePath]: "export const a = value as unknown as Target;\n" });

    const result = runAssertionAudit(fs, {
      rootDir,
      targetPath: rootDir,
      allowlist: ["packages/a/src/a.ts:value as unknown as Target"],
    });

    expect(result.ok && result.value).toMatchObject({ violationCount: 0, allowlistedCount: 1, files: [] });
  });
});
