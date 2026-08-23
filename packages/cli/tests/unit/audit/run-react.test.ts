import path from "node:path";

import { describe, expect, it } from "vitest";

import { runReactAudit } from "#/audit/run-react";
import type { CliFileEncoding, DirectoryEntry, FilesystemPort } from "#/core/filesystem/port";

describe("runReactAudit", () => {
  it("matches allowlist keys as repo-relative posix paths", () => {
    const rootDir = path.join(path.sep, "repo");
    const filePath = path.join(rootDir, "apps", "ui", "src", "demo.tsx");
    const fs = createAuditTestFilesystem({
      [filePath]: `import * as React from "react";\nexport const x = React.version;\n`,
    });

    const blocked = runReactAudit(fs, {
      rootDir,
      targetPath: path.join(rootDir, "apps", "ui", "src"),
      allowlist: [],
    });
    expect(blocked.ok).toBe(true);
    if (!blocked.ok) {
      return;
    }
    expect(blocked.value.violationCount).toBe(1);
    expect(blocked.value.files[0]?.relativePath).toBe("apps/ui/src/demo.tsx");

    const allowed = runReactAudit(fs, {
      rootDir,
      targetPath: filePath,
      allowlist: [`apps/ui/src/demo.tsx:import * as React from "react";`],
    });
    expect(allowed.ok).toBe(true);
    if (!allowed.ok) {
      return;
    }
    expect(allowed.value).toMatchObject({
      violationCount: 0,
      allowlistedCount: 1,
      scannedFileCount: 1,
      files: [],
    });
  });

  it("accepts bare-text allowlist entries and passes clean files", () => {
    const rootDir = path.join(path.sep, "repo");
    const cleanPath = path.join(rootDir, "clean.tsx");
    const umdPath = path.join(rootDir, "umd.ts");
    const fs = createAuditTestFilesystem({
      [cleanPath]: `import { useState } from "react";\nexport const use = useState;\n`,
      [umdPath]: `export type H = React.FormEvent;\n`,
    });

    const outcome = runReactAudit(fs, {
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
});

function createAuditTestFilesystem(files: Record<string, string>): FilesystemPort {
  const normalized = new Map(Object.entries(files).map(([filePath, content]) => [path.normalize(filePath), content]));

  return {
    existsSync: (filePath) => normalized.has(path.normalize(filePath)),
    canonicalPathSync: (inputPath) => path.normalize(inputPath),
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
