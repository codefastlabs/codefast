import path from "node:path";

import { describe, expect, it } from "vitest";

import { runTokenAudit } from "#/audit/run-tokens";
import type { CliFileEncoding, DirectoryEntry, FilesystemPort } from "#/core/filesystem/port";

describe("runTokenAudit", () => {
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

    const outcome = runTokenAudit(fs, { rootDir, targetPath: rootDir, allowlist: [] });
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

    const outcome = runTokenAudit(fs, {
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
