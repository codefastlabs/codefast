import path from "node:path";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { findRepoRoot } from "#/lib/infra/workspace/repo-root.adapter";

function makeFs(existsSync: (targetPath: string) => boolean): CliFs {
  return {
    existsSync,
    canonicalPathSync: (inputPath: string) => path.resolve(inputPath),
    statSync: () => ({ isDirectory: () => true, isFile: () => false }),
    readFileSync: () => "",
    writeFileSync: () => undefined,
    readdirSync: () => [],
    readFile: async () => "",
    writeFile: async () => undefined,
    readdir: async () => [],
    rename: async () => undefined,
    unlink: async () => undefined,
  };
}

describe("findRepoRoot", () => {
  it("returns the nearest ancestor containing pnpm-workspace.yaml", () => {
    const root = "/tmp/repo";
    const marker = path.join(root, "pnpm-workspace.yaml");
    const startDir = "/tmp/repo/packages/cli";
    try {
      const fs = makeFs((targetPath) => targetPath === marker);
      expect(findRepoRoot(fs, startDir)).toBe(root);
    } finally {
    }
  });

  it("includes searched candidate paths when root cannot be resolved", () => {
    const startDir = "/tmp/no-repo";
    try {
      const fs = makeFs(() => false);
      expect(() => findRepoRoot(fs, startDir)).toThrow(/Searched from:/);
      expect(() => findRepoRoot(fs, startDir)).toThrow(/\/tmp\/no-repo/);
    } finally {
    }
  });
});
