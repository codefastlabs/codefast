import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NodeCliFsAdapter } from "#/lib/infrastructure/node-io.adapter";
import {
  DEFAULT_SKIP_DIRS,
  walkTsxFiles,
} from "#/lib/shared/source-code/infrastructure/typescript-source-file-walker.service";

const cliFs = new NodeCliFsAdapter();

describe("DEFAULT_SKIP_DIRS", () => {
  it("contains common generated directories", () => {
    expect(DEFAULT_SKIP_DIRS.has("node_modules")).toBe(true);
    expect(DEFAULT_SKIP_DIRS.has(".git")).toBe(true);
    expect(DEFAULT_SKIP_DIRS.has("dist")).toBe(true);
    expect(DEFAULT_SKIP_DIRS.has(".turbo")).toBe(true);
  });
});

describe("walkTsxFiles", () => {
  it("collects .ts/.tsx, skips .d.ts and nested skipped directories", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tsx-walk-"));
    try {
      fs.mkdirSync(path.join(dir, "a", "node_modules", "x"), { recursive: true });
      fs.mkdirSync(path.join(dir, ".git", "hooks"), { recursive: true });
      fs.writeFileSync(path.join(dir, "root.ts"), "", "utf8");
      fs.writeFileSync(path.join(dir, "root.tsx"), "", "utf8");
      fs.writeFileSync(path.join(dir, "types.d.ts"), "", "utf8");
      fs.writeFileSync(path.join(dir, "a", "node_modules", "x", "ignored.tsx"), "", "utf8");
      fs.writeFileSync(path.join(dir, ".git", "hooks", "ignored.ts"), "", "utf8");

      const rel = walkTsxFiles(dir, cliFs)
        .map((p) => path.relative(dir, p).split(path.sep).join("/"))
        .sort();
      expect(rel).toEqual(["root.ts", "root.tsx"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns empty array for empty directory", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tsx-walk-empty-"));
    try {
      expect(walkTsxFiles(dir, cliFs)).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
