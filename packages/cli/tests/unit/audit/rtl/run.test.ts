import path from "node:path";

import { describe, expect, it } from "vitest";

import { runRtlAudit } from "#audit/rtl/run";
import { createAuditTestFilesystem } from "#tests/unit/support/audit-test-filesystem";

describe("runRtlAudit", () => {
  it("matches allowlist keys as repo-relative posix paths", () => {
    const rootDir = path.join(path.sep, "repo");
    const filePath = path.join(rootDir, "packages", "ui", "src", "sheet.ts");
    const fs = createAuditTestFilesystem({
      [filePath]: `const c = "ml-2 slide-in-from-left-2";`,
    });

    const blocked = runRtlAudit(fs, {
      rootDir,
      targetPath: path.join(rootDir, "packages", "ui", "src"),
      allowlist: [],
    });
    expect(blocked.ok).toBe(true);
    if (!blocked.ok) {
      return;
    }
    expect(blocked.value.violationCount).toBe(2);
    expect(blocked.value.files[0]?.relativePath).toBe("packages/ui/src/sheet.ts");

    const allowed = runRtlAudit(fs, {
      rootDir,
      targetPath: filePath,
      allowlist: ["packages/ui/src/sheet.ts:ml-2", "packages/ui/src/sheet.ts:slide-in-from-left-2"],
    });
    expect(allowed.ok).toBe(true);
    if (!allowed.ok) {
      return;
    }
    expect(allowed.value).toMatchObject({
      violationCount: 0,
      allowlistedCount: 2,
      scannedFileCount: 1,
      files: [],
    });
  });

  it("accepts bare-token allowlist entries", () => {
    const rootDir = path.join(path.sep, "repo");
    const filePath = path.join(rootDir, "a.ts");
    const fs = createAuditTestFilesystem({
      [filePath]: `const c = "text-left";`,
    });

    const outcome = runRtlAudit(fs, {
      rootDir,
      targetPath: filePath,
      allowlist: ["text-left"],
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.violationCount).toBe(0);
    expect(outcome.value.allowlistedCount).toBe(1);
  });
});
