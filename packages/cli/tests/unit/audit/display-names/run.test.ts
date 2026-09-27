import path from "node:path";

import { describe, expect, it } from "vitest";

import { runDisplayNameAudit } from "#audit/display-names/run";
import { createAuditTestFilesystem } from "#tests/unit/support/audit-test-filesystem";

describe("runDisplayNameAudit", () => {
  it("scans TypeScript and markdown, skips tests, benchmarks, changesets and changelogs", () => {
    const rootDir = path.join(path.sep, "repo");
    const fs = createAuditTestFilesystem({
      [path.join(rootDir, "packages", "di", "src", "a.ts")]: `export const A = token<number>("A");\n`,
      [path.join(rootDir, "packages", "di", "README.md")]: '```ts\nconst B = token<number>("B");\n```\n',
      [path.join(rootDir, "packages", "di", "tests", "unit", "a.test.ts")]: `token<number>("T");\n`,
      [path.join(rootDir, "benchmarks", "di", "src", "bench.ts")]: `token<number>("Bench");\n`,
      [path.join(rootDir, ".changeset", "note.md")]: `token<number>("Note");\n`,
      [path.join(rootDir, "packages", "di", "CHANGELOG.md")]: `token<number>("Old");\n`,
      [path.join(rootDir, "packages", "di", "src", "ok.ts")]: `export const C = token<number>("di:C");\n`,
    });

    const outcome = runDisplayNameAudit(fs, { rootDir, targetPath: rootDir, allowlist: [] });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.scannedFileCount).toBe(3);
    expect(outcome.value.violationCount).toBe(2);
    expect(outcome.value.files.map((file) => file.relativePath).sort()).toEqual([
      "packages/di/README.md",
      "packages/di/src/a.ts",
    ]);
  });

  it("matches allowlist keys as the call text or as repo-relative posix path plus call text", () => {
    const rootDir = path.join(path.sep, "repo");
    const filePath = path.join(rootDir, "apps", "web", "src", "demo.ts");
    const fs = createAuditTestFilesystem({
      [filePath]: `const A = token<number>("A");\nconst B = tag<string>("b");\n`,
    });

    const outcome = runDisplayNameAudit(fs, {
      rootDir,
      targetPath: filePath,
      allowlist: [`token<number>("A")`, `apps/web/src/demo.ts:tag<string>("b")`],
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value).toMatchObject({ violationCount: 0, allowlistedCount: 2, scannedFileCount: 1, files: [] });
  });
});
