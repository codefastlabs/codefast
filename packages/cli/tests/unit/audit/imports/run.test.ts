import path from "node:path";

import { describe, expect, it } from "vitest";

import { runImportsAudit } from "#audit/imports/run";
import { createAuditTestFilesystem } from "#tests/unit/support/audit-test-filesystem";

describe("runImportsAudit", () => {
  it("matches allowlist keys as repo-relative posix paths", () => {
    const rootDir = path.join(path.sep, "repo");
    const filePath = path.join(rootDir, "apps", "web", "src", "demo.tsx");
    const fs = createAuditTestFilesystem({
      [filePath]: `import * as React from "react";\nexport const x = React.version;\n`,
    });

    const blocked = runImportsAudit(fs, {
      rootDir,
      targetPath: path.join(rootDir, "apps", "web", "src"),
      allowlist: [],
    });
    expect(blocked.ok).toBe(true);
    if (!blocked.ok) {
      return;
    }
    expect(blocked.value.violationCount).toBe(1);
    expect(blocked.value.files[0]?.relativePath).toBe("apps/web/src/demo.tsx");

    const allowed = runImportsAudit(fs, {
      rootDir,
      targetPath: filePath,
      allowlist: [`apps/web/src/demo.tsx:import * as React from "react";`],
    });
    expect(allowed.ok).toBe(true);
    if (!allowed.ok) {
      return;
    }
    expect(allowed.value.violationCount).toBe(0);
    expect(allowed.value.allowlistedCount).toBe(1);
  });

  it("accepts bare-text allowlist entries and passes clean files", () => {
    const rootDir = path.join(path.sep, "repo");
    const cleanPath = path.join(rootDir, "clean.tsx");
    const umdPath = path.join(rootDir, "umd.ts");
    const fs = createAuditTestFilesystem({
      [cleanPath]: `import { useState } from "react";\nexport const use = useState;\n`,
      [umdPath]: `export type H = React.FormEvent;\n`,
    });

    const outcome = runImportsAudit(fs, {
      rootDir,
      targetPath: rootDir,
      allowlist: ["React.FormEvent"],
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.violationCount).toBe(0);
    expect(outcome.value.allowlistedCount).toBe(1);
    expect(outcome.value.scannedFileCount).toBe(2);
  });

  it("applies the Zod namespace rule to every package, accepting only the namespace form", () => {
    const rootDir = path.join(path.sep, "repo");
    const themeNamed = path.join(rootDir, "packages", "theme", "src", "named.ts");
    const themeNamespace = path.join(rootDir, "packages", "theme", "src", "namespace.ts");
    const cliNamed = path.join(rootDir, "packages", "cli", "src", "named.ts");
    const fs = createAuditTestFilesystem({
      [themeNamed]: `import { z } from "zod";\nexport const s = z.string();\n`,
      [themeNamespace]: `import * as z from "zod";\nexport const s = z.string();\n`,
      [cliNamed]: `import { z } from "zod";\nexport const s = z.string();\n`,
    });

    const outcome = runImportsAudit(fs, { rootDir, targetPath: rootDir, allowlist: [] });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    // The house form is repo-wide: every named import is flagged (backend `cli` included); only
    // the namespace form passes.
    expect(outcome.value.violationCount).toBe(2);
    expect(outcome.value.files.map((file) => file.relativePath).sort()).toEqual([
      "packages/cli/src/named.ts",
      "packages/theme/src/named.ts",
    ]);
    for (const file of outcome.value.files) {
      expect(file.violations[0]?.reason).toContain('named import { z } from "zod"');
    }
  });
});
