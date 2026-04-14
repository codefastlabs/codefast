import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runMirrorSync } from "#lib/mirror/application/sync";
import { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io";

async function mkdirp(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeText(filePath: string, content: string): Promise<void> {
  await mkdirp(filePath);
  await fs.writeFile(filePath, content, "utf8");
}

async function writeJson(filePath: string, jsonPayload: unknown): Promise<void> {
  await mkdirp(filePath);
  await fs.writeFile(filePath, JSON.stringify(jsonPayload, null, 2) + "\n", "utf8");
}

async function makeTempRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "mirror-sync-"));
}

const mirrorFs = createNodeCliFs();
const mirrorLogger = createNodeCliLogger();

async function runMirrorSyncWithNodeDependencies(
  options: Omit<Parameters<typeof runMirrorSync>[0], "fs" | "logger">,
): Promise<number> {
  return runMirrorSync({ ...options, fs: mirrorFs, logger: mirrorLogger });
}

describe("runMirrorSync (integration)", () => {
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  beforeEach(() => {
    stdoutChunks.length = 0;
    stderrChunks.length = 0;
    jest.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
      stdoutChunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
      return true;
    });
    jest.spyOn(process.stderr, "write").mockImplementation((chunk: string | Uint8Array) => {
      stderrChunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
      return true;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function joinedStdout(): string {
    return stdoutChunks.join("");
  }

  it("writes exports for a package with index.js + index.d.ts (+ optional .cjs)", async () => {
    const root = await makeTempRoot();
    const rel = "packages/widget";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/widget",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.cjs"), "module.exports = {};\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, { types: string; import?: string; require?: string } | string>;
    };
    expect(pkg.exports["./package.json"]).toBe("./package.json");
    expect(pkg.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
      require: "./dist/index.cjs",
    });
    expect(joinedStdout().includes(String.fromCharCode(27))).toBe(false);
  });

  it("applies pathTransformations from injected config", async () => {
    const root = await makeTempRoot();
    const rel = "packages/ui-bridge";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/bridge",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/internal/foo.js"), "export const x = 1;\n");
    await writeText(
      path.join(pkgDir, "dist/internal/foo.d.ts"),
      "export declare const x: number;\n",
    );

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      config: {
        pathTransformations: {
          "@fixture/bridge": { removePrefix: "./internal/" },
        },
      },
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["./foo"]).toBeDefined();
    expect(pkg.exports["./internal/foo"]).toBeUndefined();
    expect(joinedStdout()).toContain("@fixture/bridge");
    expect(joinedStdout()).not.toContain("ui-bridge");
  });

  it("ignores pathTransformations keyed by workspace-relative path (package name only)", async () => {
    const root = await makeTempRoot();
    const rel = "packages/ui-bridge";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/bridge",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/internal/foo.js"), "export const x = 1;\n");
    await writeText(
      path.join(pkgDir, "dist/internal/foo.d.ts"),
      "export declare const x: number;\n",
    );

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      config: {
        pathTransformations: {
          [rel]: { removePrefix: "./internal/" },
        },
      },
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["./internal/foo"]).toBeDefined();
    expect(pkg.exports["./foo"]).toBeUndefined();
  });

  it("merges customExports for the package", async () => {
    const root = await makeTempRoot();
    const rel = "packages/custom";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/custom",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      config: {
        customExports: {
          "@fixture/custom": { "./extra": "./dist/extra.json" },
        },
      },
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["./extra"]).toBe("./dist/extra.json");
    expect(pkg.exports["."]).toBeDefined();
  });

  it("preserves unmanaged manual exports while overriding generated exports", async () => {
    const root = await makeTempRoot();
    const rel = "packages/smart-merge";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/smart-merge",
      version: "0.0.0",
      exports: {
        ".": "./legacy-main.js",
        "./manual": "./manual/path.js",
      },
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };

    expect(pkg.exports["./manual"]).toBe("./manual/path.js");
    expect(pkg.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    });
    expect(pkg.exports["./package.json"]).toBe("./package.json");
    expect(Object.keys(pkg.exports)).toEqual([".", "./manual", "./package.json"]);
  });

  it("removes stale unmanaged exports that still point to dist files", async () => {
    const root = await makeTempRoot();
    const rel = "packages/stale-exports";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/stale-exports",
      version: "0.0.0",
      exports: {
        "./manual": "./manual/path.js",
        "./stale": "./dist/old.js",
        "./stale-object": {
          import: "./dist/old.mjs",
          types: "./dist/old.d.ts",
        },
      },
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };

    expect(pkg.exports["./manual"]).toBe("./manual/path.js");
    expect(pkg.exports["./stale"]).toBeUndefined();
    expect(pkg.exports["./stale-object"]).toBeUndefined();
    expect(pkg.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    });
    expect(pkg.exports["./package.json"]).toBe("./package.json");
    expect(Object.keys(pkg.exports)).toEqual([".", "./manual", "./package.json"]);
    expect(joinedStdout()).toContain("Pruned stale export: ./stale");
    expect(joinedStdout()).toContain("Pruned stale export: ./stale-object");
  });

  it("orders exports safely and syncs top-level compatibility fields from root export", async () => {
    const root = await makeTempRoot();
    const rel = "packages/compat-order";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/compat-order",
      version: "0.0.0",
      files: ["README.md"],
      exports: {
        "./manual": "./manual/path.js",
      },
    });
    await writeText(path.join(pkgDir, "dist/index.mjs"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.cjs"), "module.exports = {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/theme/a.css"), "a {}\n");
    await writeText(path.join(pkgDir, "dist/theme/b.css"), "b {}\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      config: {
        cssExports: {
          "@fixture/compat-order": { enabled: true },
        },
      },
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
      main?: string;
      module?: string;
      types?: string;
      files?: string[];
    };

    expect(Object.keys(pkg.exports)).toEqual([".", "./manual", "./theme/*", "./package.json"]);
    expect(pkg.main).toBe("./dist/index.cjs");
    expect(pkg.module).toBe("./dist/index.mjs");
    expect(pkg.types).toBe("./dist/index.d.ts");
    expect(pkg.files).toEqual(["README.md", "dist"]);
  });

  it("sorts transformed specifiers by original dist path order", async () => {
    const root = await makeTempRoot();
    const rel = "packages/path-order";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/path-order",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/external/a.js"), "export const a = 1;\n");
    await writeText(path.join(pkgDir, "dist/external/a.d.ts"), "export declare const a: number;\n");
    await writeText(path.join(pkgDir, "dist/internal/b.js"), "export const b = 1;\n");
    await writeText(path.join(pkgDir, "dist/internal/b.d.ts"), "export declare const b: number;\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      config: {
        pathTransformations: {
          "@fixture/path-order": { removePrefix: "./internal/" },
        },
      },
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };

    // Original paths are ./external/a then ./internal/b (transformed to ./b).
    expect(Object.keys(pkg.exports)).toEqual(["./external/a", "./b", "./package.json"]);
  });

  it("emits CSS wildcard exports for a css-only subfolder when cssExports is enabled", async () => {
    const root = await makeTempRoot();
    const rel = "packages/styles";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/styles",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/theme/a.css"), "a {}\n");
    await writeText(path.join(pkgDir, "dist/theme/b.css"), "b {}\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      config: {
        cssExports: {
          "@fixture/styles": { enabled: true },
        },
      },
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["./theme/*"]).toBe("./dist/theme/*");
  });

  it("uses per-file CSS exports when forceExportFiles is set", async () => {
    const root = await makeTempRoot();
    const rel = "packages/styles-force";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/styles2",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/blocks/x.css"), "x {}\n");
    await writeText(path.join(pkgDir, "dist/blocks/y.css"), "y {}\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      config: {
        cssExports: {
          "@fixture/styles2": { enabled: true, forceExportFiles: true },
        },
      },
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["./blocks/x.css"]).toBe("./dist/blocks/x.css");
    expect(pkg.exports["./blocks/y.css"]).toBe("./dist/blocks/y.css");
    expect(pkg.exports["./blocks/*"]).toBeUndefined();
  });

  it("skips CSS generation when cssExports is false for that package", async () => {
    const root = await makeTempRoot();
    const rel = "packages/no-css";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/nocss",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/root.css"), "r {}\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      verbose: true,
      config: {
        cssExports: {
          "@fixture/nocss": false,
        },
      },
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["./root.css"]).toBeUndefined();
    expect(joinedStdout()).toContain("CSS disabled");
  });

  it("skips packages listed in skipPackages", async () => {
    const root = await makeTempRoot();
    const rel = "packages/skipped-one";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), { name: "@fixture/skip", version: "0.0.0" });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      config: { skipPackages: ["@fixture/skip"] },
    });
    expect(code).toBe(0);

    const raw = await fs.readFile(path.join(pkgDir, "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { exports?: unknown };
    expect(pkg.exports).toBeUndefined();
    expect(joinedStdout()).toContain("Skipped");
    expect(joinedStdout()).toContain("@fixture/skip");
  });

  it("applies skipPackages before dist/ existence (skipped package without dist/)", async () => {
    const root = await makeTempRoot();
    const rel = "packages/skip-no-dist";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/skip-nodist",
      version: "0.0.0",
    });

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      config: { skipPackages: ["@fixture/skip-nodist"] },
    });
    expect(code).toBe(0);

    const raw = await fs.readFile(path.join(pkgDir, "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { exports?: unknown };
    expect(pkg.exports).toBeUndefined();

    const out = joinedStdout();
    expect(out).toContain("Skipped");
    expect(out).toContain("configured to skip");
    expect(out).toContain("@fixture/skip-nodist");
    expect(out).not.toContain("dist/ not found");
  });

  it("skips when package.json is missing", async () => {
    const root = await makeTempRoot();
    const rel = "packages/nopkg";
    const pkgDir = path.join(root, rel);
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
    });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("package.json not found");
  });

  it("skips when dist/ is missing", async () => {
    const root = await makeTempRoot();
    const rel = "packages/nodist";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/nodist",
      version: "0.0.0",
    });

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
    });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("dist/ not found");
    expect(joinedStdout()).toContain("@fixture/nodist");
  });

  it("returns 0 when no workspace packages match discovery globs", async () => {
    const root = await makeTempRoot();
    const code = await runMirrorSyncWithNodeDependencies({ rootDir: root, noColor: true });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("No packages found");
  });

  it("discovers packages under packages/ via default glob when pnpm-workspace.yaml is absent", async () => {
    const root = await makeTempRoot();
    for (const name of ["alpha", "beta"]) {
      const rel = path.join("packages", name);
      const pkgDir = path.join(root, rel);
      await writeJson(path.join(pkgDir, "package.json"), {
        name: `@fixture/${name}`,
        version: "0.0.0",
      });
      await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
      await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    }

    const code = await runMirrorSyncWithNodeDependencies({ rootDir: root, noColor: true });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("default patterns");
    expect(joinedStdout()).toContain("@fixture/alpha");
    expect(joinedStdout()).toContain("@fixture/beta");
  });

  it("discovers packages from explicit pnpm-workspace.yaml globs (e.g. apps/* and packages/*)", async () => {
    const root = await makeTempRoot();
    await writeText(
      path.join(root, "pnpm-workspace.yaml"),
      `packages:
  - 'apps/*'
  - 'packages/*'
`,
    );
    for (const [rel, nm] of [
      ["apps/web", "@fixture/web"],
      ["packages/lib", "@fixture/lib"],
    ] as const) {
      const pkgDir = path.join(root, rel);
      await writeJson(path.join(pkgDir, "package.json"), {
        name: nm,
        version: "0.0.0",
      });
      await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
      await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    }

    const code = await runMirrorSyncWithNodeDependencies({ rootDir: root, noColor: true });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("from pnpm-workspace.yaml");
    expect(joinedStdout()).toContain("@fixture/web");
    expect(joinedStdout()).toContain("@fixture/lib");
  });

  it("skips packages excluded with ! in pnpm-workspace.yaml", async () => {
    const root = await makeTempRoot();
    await writeText(
      path.join(root, "pnpm-workspace.yaml"),
      `packages:
  - 'packages/*'
  - '!packages/ignored'
`,
    );
    for (const name of ["kept", "ignored"]) {
      const rel = path.join("packages", name);
      const pkgDir = path.join(root, rel);
      await writeJson(path.join(pkgDir, "package.json"), {
        name: `@fixture/${name}`,
        version: "0.0.0",
        exports: { "./only": "./dist/only.json" },
      });
      await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
      await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    }

    const code = await runMirrorSyncWithNodeDependencies({ rootDir: root, noColor: true });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("@fixture/kept");
    expect(joinedStdout()).not.toContain("@fixture/ignored");

    const ignoredRaw = await fs.readFile(
      path.join(root, "packages", "ignored", "package.json"),
      "utf8",
    );
    const ignoredPkg = JSON.parse(ignoredRaw) as { exports?: unknown };
    expect(ignoredPkg.exports).toEqual({ "./only": "./dist/only.json" });
  });

  it("returns exit code 1 when package.json is invalid JSON", async () => {
    const root = await makeTempRoot();
    const rel = "packages/broken";
    const pkgDir = path.join(root, rel);
    await writeText(path.join(pkgDir, "package.json"), "{ not json");
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      verbose: true,
    });
    expect(code).toBe(1);
    expect(joinedStdout()).toContain("Error");
    expect(stderrChunks.join("")).toBeTruthy();
  });

  it("only leaves ./package.json export when dist has no valid JS modules", async () => {
    const root = await makeTempRoot();
    const rel = "packages/empty-modules";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/empty",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/readme.txt"), "noop\n");

    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
    });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(Object.keys(pkg.exports)).toEqual(["./package.json"]);
  });

  it("uses folder basename in logs when package.json is invalid JSON while skipping missing dist", async () => {
    const root = await makeTempRoot();
    const rel = "packages/bad-json-nodist";
    const pkgDir = path.join(root, rel);
    await writeText(path.join(pkgDir, "package.json"), "{ not json");
    const code = await runMirrorSyncWithNodeDependencies({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
    });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("dist/ not found");
    expect(joinedStdout()).toContain("bad-json-nodist");
  });

  it("fails fast when pnpm-workspace.yaml exists but is invalid YAML", async () => {
    const root = await makeTempRoot();
    await writeText(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - [\n");
    const code = await runMirrorSyncWithNodeDependencies({ rootDir: root, noColor: true });
    expect(code).toBe(1);
    expect(joinedStdout()).toContain("Fatal error");
    expect(joinedStdout()).toMatch(/pnpm-workspace\.yaml|Failed to parse/i);
  });

  it("treats packages: [] as no workspace packages", async () => {
    const root = await makeTempRoot();
    await writeText(path.join(root, "pnpm-workspace.yaml"), "packages: []\n");
    const code = await runMirrorSyncWithNodeDependencies({ rootDir: root, noColor: true });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("empty workspace package list");
    expect(joinedStdout()).toContain("No packages found");
  });

  it("fails fast when pnpm-workspace.yaml packages is not an array", async () => {
    const root = await makeTempRoot();
    await writeText(
      path.join(root, "pnpm-workspace.yaml"),
      `packages: "oops"
`,
    );
    const code = await runMirrorSyncWithNodeDependencies({ rootDir: root, noColor: true });
    expect(code).toBe(1);
    expect(joinedStdout()).toContain("Fatal error");
    expect(joinedStdout()).toMatch(/packages.*must be an array/i);
  });

  it("resolves packageFilter relative to rootDir when cwd differs (API)", async () => {
    const root = await makeTempRoot();
    const rel = "packages/api-cwd";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/api-cwd",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const prev = process.cwd();
    try {
      process.chdir(os.tmpdir());
      const code = await runMirrorSyncWithNodeDependencies({
        rootDir: root,
        noColor: true,
        packageFilter: rel,
      });
      expect(code).toBe(0);
    } finally {
      process.chdir(prev);
    }

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["."]).toBeDefined();
  });
});
