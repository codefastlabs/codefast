import path from "node:path";

import { describe, expect, it } from "vitest";

import { runRtlAudit } from "#/audit/run";
import type { CliFileEncoding, DirectoryEntry, FilesystemPort } from "#/core/filesystem/port";

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
