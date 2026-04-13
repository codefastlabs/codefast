import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { CliLogger } from "#lib/infra/fs-contract";
import { createNodeCliFs } from "#lib/infra/node-io";
import {
  findWorkspacePackageRelPaths,
  parsePnpmWorkspaceDocument,
  splitWorkspacePackageEntries,
  workspacePatternToPackageJsonGlob,
} from "#lib/mirror/workspace-packages";

function createTestLogger(): CliLogger & { lines: string[] } {
  const lines: string[] = [];
  return {
    lines,
    out: (line: string) => {
      lines.push(line);
    },
    err: (line: string) => {
      lines.push(`[err] ${line}`);
    },
  };
}

describe("splitWorkspacePackageEntries", () => {
  it("splits include and exclude entries", () => {
    expect(splitWorkspacePackageEntries(["packages/*", "!packages/playground", "apps/*"])).toEqual({
      include: ["packages/*", "apps/*"],
      exclude: ["packages/playground"],
    });
  });

  it("ignores non-strings", () => {
    expect(splitWorkspacePackageEntries(["a", 1, null, "b"])).toEqual({
      include: ["a", "b"],
      exclude: [],
    });
  });
});

describe("parsePnpmWorkspaceDocument", () => {
  it("throws on non-object root", () => {
    expect(() => parsePnpmWorkspaceDocument([])).toThrow(/root must be a mapping/);
    expect(() => parsePnpmWorkspaceDocument("x")).toThrow(/root must be a mapping/);
  });

  it("throws when packages is not an array", () => {
    expect(() => parsePnpmWorkspaceDocument({ packages: "nope" })).toThrow(/must be an array/);
  });

  it("marks missing packages key", () => {
    expect(parsePnpmWorkspaceDocument({ catalog: {} })).toEqual({
      include: [],
      exclude: [],
      hasPackagesKey: false,
      isEmptyPackagesArray: false,
    });
  });

  it("marks explicit empty array", () => {
    expect(parsePnpmWorkspaceDocument({ packages: [] })).toEqual({
      include: [],
      exclude: [],
      hasPackagesKey: true,
      isEmptyPackagesArray: true,
    });
  });
});

describe("workspacePatternToPackageJsonGlob", () => {
  it("appends /package.json with POSIX slashes", () => {
    expect(workspacePatternToPackageJsonGlob("packages/*")).toBe("packages/*/package.json");
    expect(workspacePatternToPackageJsonGlob("packages/**")).toBe("packages/**/package.json");
    expect(workspacePatternToPackageJsonGlob("apps/*")).toBe("apps/*/package.json");
  });
});

describe("findWorkspacePackageRelPaths", () => {
  const cliFs = createNodeCliFs();

  it("falls back to packages/* when pnpm-workspace.yaml is missing", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ws-missing-"));
    const logger = createTestLogger();
    try {
      fs.mkdirSync(path.join(root, "packages", "a"), { recursive: true });
      fs.writeFileSync(path.join(root, "packages", "a", "package.json"), "{}", "utf8");
      const { relPaths, multiSource } = await findWorkspacePackageRelPaths(root, cliFs, logger);
      expect(relPaths).toEqual(["packages/a"]);
      expect(multiSource).toBe("default-patterns");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("reads globs from pnpm-workspace.yaml", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ws-yaml-"));
    const logger = createTestLogger();
    try {
      fs.writeFileSync(
        path.join(root, "pnpm-workspace.yaml"),
        `packages:
  - 'tooling/*'
  - 'packages/*'
`,
        "utf8",
      );
      fs.mkdirSync(path.join(root, "tooling", "eslint"), { recursive: true });
      fs.writeFileSync(path.join(root, "tooling", "eslint", "package.json"), "{}", "utf8");
      fs.mkdirSync(path.join(root, "packages", "ui"), { recursive: true });
      fs.writeFileSync(path.join(root, "packages", "ui", "package.json"), "{}", "utf8");

      const { relPaths, multiSource } = await findWorkspacePackageRelPaths(root, cliFs, logger);
      expect(relPaths).toEqual(["packages/ui", "tooling/eslint"]);
      expect(multiSource).toBe("pnpm-workspace-yaml");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("applies negated workspace patterns", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ws-neg-"));
    const logger = createTestLogger();
    try {
      fs.writeFileSync(
        path.join(root, "pnpm-workspace.yaml"),
        `packages:
  - 'packages/*'
  - '!packages/skip'
`,
        "utf8",
      );
      for (const name of ["keep", "skip"]) {
        fs.mkdirSync(path.join(root, "packages", name), { recursive: true });
        fs.writeFileSync(path.join(root, "packages", name, "package.json"), "{}", "utf8");
      }
      const { relPaths, multiSource } = await findWorkspacePackageRelPaths(root, cliFs, logger);
      expect(relPaths).toEqual(["packages/keep"]);
      expect(multiSource).toBe("pnpm-workspace-yaml");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("returns empty paths when packages is an explicit empty array", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ws-empty-arr-"));
    const logger = createTestLogger();
    try {
      fs.writeFileSync(
        path.join(root, "pnpm-workspace.yaml"),
        `packages: []
`,
        "utf8",
      );
      const { relPaths, multiSource } = await findWorkspacePackageRelPaths(root, cliFs, logger);
      expect(relPaths).toEqual([]);
      expect(multiSource).toBe("declared-empty");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects invalid YAML document when file exists", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ws-bad-yaml-"));
    const logger = createTestLogger();
    try {
      fs.writeFileSync(path.join(root, "pnpm-workspace.yaml"), "{ not yaml", "utf8");
      await expect(findWorkspacePackageRelPaths(root, cliFs, logger)).rejects.toThrow(
        /Failed to parse pnpm-workspace.yaml/,
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
