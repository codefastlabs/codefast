import path from "node:path";
import type { CliFs } from "#lib/infra/fs-contract.port";
import { findRepoRoot } from "#lib/infra/workspace/repo-root.adapter";

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
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/tmp/repo/packages/cli");
    try {
      const fs = makeFs((targetPath) => targetPath === marker);
      expect(findRepoRoot(fs)).toBe(root);
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it("includes searched candidate paths when root cannot be resolved", () => {
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/tmp/no-repo");
    try {
      const fs = makeFs(() => false);
      expect(() => findRepoRoot(fs)).toThrow(/Searched from:/);
      expect(() => findRepoRoot(fs)).toThrow(/\/tmp\/no-repo/);
    } finally {
      cwdSpy.mockRestore();
    }
  });
});
