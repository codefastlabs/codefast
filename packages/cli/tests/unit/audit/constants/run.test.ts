import path from "node:path";

import { describe, expect, it } from "vitest";

import { runConstantAudit } from "#audit/constants/run";
import type { CliFileEncoding, DirectoryEntry, Filesystem } from "#core/filesystem/filesystem";

describe("runConstantAudit", () => {
  it("reports an unlabelled numeric constant and accepts each of the three kinds", () => {
    const rootDir = path.join(path.sep, "repo");
    const fs = createAuditTestFilesystem({
      [path.join(rootDir, "packages", "di", "src", "a.ts")]: [
        "/** The bits a mask holds: the width of a 32-bit integer, a constant of the machine. */",
        "const MASK_WIDTH = 32;",
        "// The longest name the wire allows, a value the contract fixes.",
        "export const NAME_LIMIT = 64;",
        "/** The bucket count, derived from bind-time data: one per registered tag key. */",
        "const BUCKETS: number = 16;",
        "const LOOKS_REASONABLE = 8;",
        "export const ROOT_BRANCH = 0 as BranchDepth;",
        "const NO_STAMP = -1;",
        "",
      ].join("\n"),
      [path.join(rootDir, "packages", "di", "tests", "unit", "a.test.ts")]: "const N = 8;\n",
      [path.join(rootDir, "benchmarks", "di", "src", "bench.ts")]: "const BATCH = 200;\n",
    });

    const outcome = runConstantAudit(fs, { rootDir, targetPath: rootDir, allowlist: [] });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.scannedFileCount).toBe(1);
    expect(outcome.value.violationCount).toBe(1);
    expect(outcome.value.files[0]?.violations[0]).toMatchObject({ line: 7, raw: "LOOKS_REASONABLE = 8" });
  });

  it("matches allowlist keys as the constant's name or as repo-relative posix path plus name", () => {
    const rootDir = path.join(path.sep, "repo");
    const filePath = path.join(rootDir, "packages", "di", "src", "b.ts");
    const fs = createAuditTestFilesystem({
      [filePath]: "const FIRST = 8;\nconst SECOND = 32;\n",
    });

    const outcome = runConstantAudit(fs, {
      rootDir,
      targetPath: filePath,
      allowlist: ["FIRST", "packages/di/src/b.ts:SECOND"],
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.violationCount).toBe(0);
    expect(outcome.value.allowlistedCount).toBe(2);
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
