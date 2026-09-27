import path from "node:path";

import { describe, expect, it } from "vitest";

import { runLayersAudit } from "#audit/layers/run";
import { createAuditTestFilesystem } from "#tests/unit/support/audit-test-filesystem";

const rootDir = path.join(path.sep, "repo");
const diRoot = path.join(rootDir, "packages", "di", "src");
const files = {
  [path.join(diRoot, "core", "token.ts")]: `export const token = 1;\n`,
  [path.join(diRoot, "core", "binding.ts")]: `import { resolve } from "#engine/resolver";\nexport const b = resolve;\n`,
  [path.join(diRoot, "engine", "resolver.ts")]: `import { token } from "#core/token";\nexport const resolve = token;\n`,
  [path.join(diRoot, "index.ts")]: `export { b } from "#core/binding";\nexport { resolve } from "#engine/resolver";\n`,
};
const packages = [{ name: "@acme/di", rootPath: diRoot, layers: [["core"], ["engine"], ["index.ts"]] }];

describe("runLayersAudit", () => {
  it("reports the one import that points up, with a repo-relative path", () => {
    const outcome = runLayersAudit(createAuditTestFilesystem(files), {
      rootDir,
      targetPath: rootDir,
      allowlist: [],
      packages,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value).toMatchObject({ violationCount: 1, scannedFileCount: 4, packageCount: 1 });
    expect(outcome.value.files[0]?.relativePath).toBe("packages/di/src/core/binding.ts");
  });

  it("honours an allowlist entry spelled bare or with its file", () => {
    const raw = `import { resolve } from "#engine/resolver";`;
    for (const entry of [raw, `packages/di/src/core/binding.ts:${raw}`]) {
      const outcome = runLayersAudit(createAuditTestFilesystem(files), {
        rootDir,
        targetPath: rootDir,
        allowlist: [entry],
        packages,
      });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) {
        return;
      }
      expect(outcome.value).toMatchObject({ violationCount: 0, allowlistedCount: 1 });
    }
  });

  it("narrows to the modules under a target inside a package, and skips packages the target misses", () => {
    const fs = createAuditTestFilesystem(files);
    const narrowed = runLayersAudit(fs, {
      rootDir,
      targetPath: path.join(diRoot, "engine"),
      allowlist: [],
      packages,
    });
    expect(narrowed.ok).toBe(true);
    if (!narrowed.ok) {
      return;
    }
    expect(narrowed.value).toMatchObject({ violationCount: 0, scannedFileCount: 1, packageCount: 1 });

    const elsewhere = runLayersAudit(fs, {
      rootDir,
      targetPath: path.join(rootDir, "packages", "ui"),
      allowlist: [],
      packages,
    });
    expect(elsewhere.ok).toBe(true);
    if (!elsewhere.ok) {
      return;
    }
    expect(elsewhere.value).toMatchObject({ scannedFileCount: 0, packageCount: 0 });
  });
});
