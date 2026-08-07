import path from "node:path";

import { describe, expect, it } from "vitest";

import { runLinkAudit } from "#/audit/run-links";
import type { CliFileEncoding, DirectoryEntry, FilesystemPort } from "#/core/filesystem/port";

const rootDir = path.join(path.sep, "repo");
const docsDir = path.join(rootDir, "docs");

describe("runLinkAudit", () => {
  it("passes a path that exists and an anchor its target offers", () => {
    const fs = createLinkTestFilesystem({
      [path.join(docsDir, "guide.md")]: [
        "# Guide",
        "[spec](../SPEC.md#chain-order)",
        "[self](#guide)",
        "[out](https://example.com/#nope)",
      ].join("\n"),
      [path.join(rootDir, "SPEC.md")]: '<a id="chain-order"></a>\n\n### 2.4 Chain',
    });

    const outcome = runLinkAudit(fs, { rootDir, targetPath: docsDir, allowlist: [] });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    // Three links are written; the external one is not this audit's to check, so two are counted.
    expect(outcome.value).toMatchObject({ breakageCount: 0, linkCount: 2, files: [] });
  });

  it("reports a missing path, a dangling own anchor, and a dangling cross-document anchor", () => {
    const fs = createLinkTestFilesystem({
      [path.join(docsDir, "guide.md")]: [
        "# Guide",
        "[gone](./missing.md)",
        "[nowhere](#not-a-heading)",
        "[stale](../SPEC.md#removed)",
      ].join("\n"),
      [path.join(rootDir, "SPEC.md")]: "# Spec",
    });

    const outcome = runLinkAudit(fs, { rootDir, targetPath: docsDir, allowlist: [] });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.breakageCount).toBe(3);
    expect(outcome.value.files[0]?.relativePath).toBe("docs/guide.md");
    expect(outcome.value.files[0]?.breakages.map((breakage) => breakage.reason)).toEqual([
      "path does not exist",
      "anchor not found in this document",
      "anchor not found in SPEC.md",
    ]);
  });

  it("matches allowlist entries bare and as repo-relative posix keys", () => {
    const files = {
      [path.join(docsDir, "guide.md")]: "# Guide\n[gone](./missing.md)",
    };

    const bare = runLinkAudit(createLinkTestFilesystem(files), {
      rootDir,
      targetPath: docsDir,
      allowlist: ["./missing.md"],
    });
    const keyed = runLinkAudit(createLinkTestFilesystem(files), {
      rootDir,
      targetPath: docsDir,
      allowlist: ["docs/guide.md:./missing.md"],
    });

    for (const outcome of [bare, keyed]) {
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) {
        return;
      }
      expect(outcome.value).toMatchObject({ breakageCount: 0, allowlistedCount: 1 });
    }
  });

  it("does not check an anchor against a target that is not markdown", () => {
    const fs = createLinkTestFilesystem({
      [path.join(docsDir, "guide.md")]: "# Guide\n[src](../src/index.ts#L20)",
      [path.join(rootDir, "src", "index.ts")]: "export const x = 1;",
    });

    const outcome = runLinkAudit(fs, { rootDir, targetPath: docsDir, allowlist: [] });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.breakageCount).toBe(0);
  });
});

function createLinkTestFilesystem(files: Record<string, string>): FilesystemPort {
  const normalized = new Map(Object.entries(files).map(([filePath, content]) => [path.normalize(filePath), content]));

  return {
    existsSync: (filePath) => normalized.has(path.normalize(filePath)),
    canonicalPathSync: (inputPath) => path.normalize(inputPath),
    statSync: (filePath) => {
      const normalizedPath = path.normalize(filePath);
      if (normalized.has(normalizedPath)) {
        return { isDirectory: () => false, isFile: () => true };
      }
      const hasChild = [...normalized.keys()].some((candidate) => candidate.startsWith(normalizedPath + path.sep));
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
        const name = filePath.slice(prefix.length).split(path.sep)[0];
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
