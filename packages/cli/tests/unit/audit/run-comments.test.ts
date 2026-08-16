import path from "node:path";

import { describe, expect, it } from "vitest";

import { runCommentAudit } from "#/audit/run-comments";
import type { FilesystemPort } from "#/core/filesystem/port";

const rootDir = path.join(path.sep, "repo");
const srcDir = path.join(rootDir, "src");

const legacyDivider = ["/* -----------", " * Component: Button", " * ----------- */"].join("\n");

describe("runCommentAudit", () => {
  it("reports a legacy divider and counts every scanned divider", () => {
    const { fs } = createSourceTestFilesystem({
      [path.join(srcDir, "button.tsx")]: `${legacyDivider}\nexport const a = 1;`,
    });

    const outcome = runCommentAudit(fs, { rootDir, targetPath: rootDir, allowlist: [], fix: false });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value).toMatchObject({ breakageCount: 1, dividerCount: 1, fixedCount: 0, scannedFileCount: 1 });
    expect(outcome.value.files[0]?.breakages[0]?.reason).toBe("legacy divider form");
  });

  it("rewrites fixable dividers in place with fix, then reports clean", () => {
    const filePath = path.join(srcDir, "button.tsx");
    const { fs, contents } = createSourceTestFilesystem({ [filePath]: `${legacyDivider}\nexport const a = 1;` });

    const outcome = runCommentAudit(fs, { rootDir, targetPath: rootDir, allowlist: [], fix: true });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value).toMatchObject({ breakageCount: 0, fixedCount: 1 });
    expect(contents.get(path.normalize(filePath))).toContain("// ── Component: Button ──");
  });

  it("routes content, grammar, and css findings through with their own reasons", () => {
    const docPointer = ["/**", " * Field order is fixed; see ARCHITECTURE.md for why.", " */"].join("\n");
    const bareAtWord = ["/**", " * Benchmarks @codefast/di against upstream.", " */"].join("\n");
    const { fs } = createSourceTestFilesystem({
      [path.join(srcDir, "pointer.ts")]: `${docPointer}\nexport const a = 1;`,
      [path.join(srcDir, "grammar.ts")]: `${bareAtWord}\nexport const b = 2;`,
      [path.join(srcDir, "theme.css")]: "/* see THEMING.md */\nbody { color: red; }",
    });

    const outcome = runCommentAudit(fs, { rootDir, targetPath: rootDir, allowlist: [], fix: false });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    const reasonsByFile = new Map(
      outcome.value.files.map((file) => [file.relativePath, file.breakages.map((breakage) => breakage.reason)]),
    );
    expect(reasonsByFile.get("src/pointer.ts")?.[0]).toContain("state the invariant");
    expect(reasonsByFile.get("src/grammar.ts")?.[0]).toContain("looks like a TSDoc tag");
    expect(reasonsByFile.get("src/theme.css")?.[0]).toContain("state the invariant");
  });

  it("matches allowlist entries bare and as repo-relative keys", () => {
    const files = {
      [path.join(srcDir, "button.tsx")]: `${legacyDivider}\nexport const a = 1;`,
    };

    for (const allowlist of [["/* -----------"], ["src/button.tsx:/* -----------"]]) {
      const { fs } = createSourceTestFilesystem(files);
      const outcome = runCommentAudit(fs, { rootDir, targetPath: rootDir, allowlist, fix: false });

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) {
        return;
      }
      expect(outcome.value).toMatchObject({ breakageCount: 0, allowlistedCount: 1 });
    }
  });

  it("flags an orphaned {@link} on a full-tree scan and stays quiet on a live one", () => {
    const link = (target: string): string => "{@" + `link ${target}}`;
    const { fs } = createSourceTestFilesystem({
      [path.join(srcDir, "docs.ts")]: [
        `/** Streams rows the way ${link("writeRows")} and ${link("goneSymbol")} do. */`,
        "export const c = 3;",
      ].join("\n"),
      [path.join(srcDir, "writer.ts")]: "export function writeRows(): void {}",
    });

    const outcome = runCommentAudit(fs, { rootDir, targetPath: rootDir, allowlist: [], fix: false });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.breakageCount).toBe(1);
    expect(outcome.value.files[0]?.breakages[0]?.raw).toBe("{@" + "link goneSymbol}");
  });

  it("skips {@link} resolution when the scan covers only part of the tree", () => {
    const { fs } = createSourceTestFilesystem({
      [path.join(srcDir, "docs.ts")]: ["/** Mirrors {@" + "link definedElsewhere}. */", "export const d = 4;"].join(
        "\n",
      ),
    });

    const outcome = runCommentAudit(fs, { rootDir, targetPath: srcDir, allowlist: [], fix: false });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.breakageCount).toBe(0);
  });

  it("surfaces a filesystem failure as an INFRA_FAILURE result, not a throw", () => {
    const { fs } = createSourceTestFilesystem({});
    const outcome = runCommentAudit(fs, {
      rootDir,
      targetPath: path.join(rootDir, "missing"),
      allowlist: [],
      fix: false,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.error.code).toBe("INFRA_FAILURE");
  });
});

function createSourceTestFilesystem(files: Record<string, string>): {
  fs: FilesystemPort;
  contents: Map<string, string>;
} {
  const contents = new Map(Object.entries(files).map(([filePath, content]) => [path.normalize(filePath), content]));

  const fs: FilesystemPort = {
    existsSync: (filePath) => contents.has(path.normalize(filePath)),
    canonicalPathSync: (inputPath) => path.normalize(inputPath),
    statSync: (filePath) => {
      const normalizedPath = path.normalize(filePath);
      if (contents.has(normalizedPath)) {
        return { isDirectory: () => false, isFile: () => true };
      }
      const hasChild = [...contents.keys()].some((candidate) => candidate.startsWith(normalizedPath + path.sep));
      if (hasChild) {
        return { isDirectory: () => true, isFile: () => false };
      }
      throw new Error(`missing path: ${filePath}`);
    },
    readFileSync: (filePath, encoding) => {
      if (encoding !== "utf8") {
        throw new Error("unexpected encoding");
      }
      const content = contents.get(path.normalize(filePath));
      if (content === undefined) {
        throw new Error(`missing file: ${filePath}`);
      }
      return content;
    },
    writeFileSync: (filePath, data) => {
      contents.set(path.normalize(filePath), data);
    },
    readdirSync: (directoryPath) => {
      const normalizedDirectory = path.normalize(directoryPath);
      const prefix = normalizedDirectory.endsWith(path.sep) ? normalizedDirectory : normalizedDirectory + path.sep;
      const names = new Set<string>();
      for (const filePath of contents.keys()) {
        if (filePath.startsWith(prefix)) {
          const name = filePath.slice(prefix.length).split(path.sep)[0];
          if (name !== undefined && name.length > 0) {
            names.add(name);
          }
        }
      }
      return [...names];
    },
    readFile: () => Promise.reject(new Error("unexpected async read")),
    writeFile: () => Promise.reject(new Error("unexpected async write")),
    readdir: () => Promise.reject(new Error("unexpected async readdir")),
    rename: () => Promise.reject(new Error("unexpected rename")),
    unlink: () => Promise.reject(new Error("unexpected unlink")),
  };

  return { fs, contents };
}
