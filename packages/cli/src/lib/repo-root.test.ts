import path from "node:path";
import type { CliFs } from "#lib/infra/fs-contract";
import { findRepoRoot } from "#lib/repo-root";

function makeFs(existsSync: (targetPath: string) => boolean): CliFs {
  return {
    existsSync,
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
    const cwdSpy = jest.spyOn(process, "cwd").mockReturnValue("/tmp/repo/packages/cli");
    try {
      const fs = makeFs((targetPath) => targetPath === marker);
      expect(findRepoRoot(fs)).toBe(root);
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it("includes searched candidate paths when root cannot be resolved", () => {
    const cwdSpy = jest.spyOn(process, "cwd").mockReturnValue("/tmp/no-repo");
    try {
      const fs = makeFs(() => false);
      expect(() => findRepoRoot(fs)).toThrow(/Searched from:/);
      expect(() => findRepoRoot(fs)).toThrow(/\/tmp\/no-repo/);
    } finally {
      cwdSpy.mockRestore();
    }
  });
});
