import path from "node:path";

import { describe, expect, it } from "vitest";

import { runImportsAudit } from "#/audit/imports/run";
import type { CliFileEncoding, DirectoryEntry, FilesystemPort } from "#/core/filesystem/port";

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

  it("applies the Zod namespace rule only to front-end packages", () => {
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
    // Only the front-end named import is flagged: the namespace form is allowed, and the
    // backend package (packages/cli) is outside the Zod rule's scope.
    expect(outcome.value.violationCount).toBe(1);
    expect(outcome.value.files.map((file) => file.relativePath)).toEqual(["packages/theme/src/named.ts"]);
    expect(outcome.value.files[0]?.violations[0]?.reason).toContain('named import { z } from "zod"');
  });
});

function createAuditTestFilesystem(files: Record<string, string>): FilesystemPort {
  const normalized = new Map(Object.entries(files).map(([filePath, content]) => [path.normalize(filePath), content]));

  return {
    existsSync: (filePath) => normalized.has(path.normalize(filePath)),
    canonicalPathSync: (inputPath) => path.normalize(inputPath),
    globSync: () => [],
    statSync: (filePath) => {
      const normalizedPath = path.normalize(filePath);
      if (normalized.has(normalizedPath)) {
        return { isDirectory: () => false, isFile: () => true };
      }
      const hasChild = [...normalized.keys()].some(
        (candidate) => candidate === normalizedPath || candidate.startsWith(normalizedPath + path.sep),
      );
      if (hasChild) {
        return { isDirectory: () => true, isFile: () => false };
      }
      throw new Error(`missing path: ${filePath}`);
    },
    readFileSync: (filePath, encoding) => {
      if (encoding !== "utf8") {
        throw new Error("unexpected encoding");
      }
      const content = normalized.get(path.normalize(filePath));
      if (content === undefined) {
        throw new Error(`missing file: ${filePath}`);
      }
      return content;
    },
    writeFileSync: () => {
      throw new Error("unexpected write");
    },
    readdirSync: (directoryPath) => {
      const normalizedDirectory = path.normalize(directoryPath);
      const prefix = normalizedDirectory.endsWith(path.sep) ? normalizedDirectory : normalizedDirectory + path.sep;
      const names = new Set<string>();
      for (const filePath of normalized.keys()) {
        if (!filePath.startsWith(prefix)) {
          continue;
        }
        const rest = filePath.slice(prefix.length);
        const name = rest.split(path.sep)[0];
        if (name) {
          names.add(name);
        }
      }
      return [...names];
    },
    readFile: async () => "",
    writeFile: async (_filePath: string, _data: string, _encoding: CliFileEncoding) => {},
    readdir: async (): Promise<Array<string> | Array<DirectoryEntry>> => [],
    rename: async () => {},
    unlink: async () => {},
  };
}
