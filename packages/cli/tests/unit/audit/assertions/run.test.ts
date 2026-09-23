import path from "node:path";

import { describe, expect, it } from "vitest";

import { runAssertionAudit } from "#audit/assertions/run";
import type { CliFileEncoding, DirectoryEntry, Filesystem } from "#core/filesystem/filesystem";

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

function createAuditTestFilesystem(files: Record<string, string>): Filesystem {
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
    readdirEntries: async (): Promise<Array<DirectoryEntry>> => [],
    rename: async () => {},
    unlink: async () => {},
  };
}
