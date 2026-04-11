import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runMirrorSync } from "#lib/mirror";

async function mkdirp(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeText(filePath: string, content: string): Promise<void> {
  await mkdirp(filePath);
  await fs.writeFile(filePath, content, "utf8");
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdirp(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function makeTempRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "mirror-sync-"));
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

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
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

  it("applies pathTransformations from codefast.config.json", async () => {
    const root = await makeTempRoot();
    const rel = "packages/ui-bridge";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(root, "codefast.config.json"), {
      mirror: {
        pathTransformations: {
          [rel]: { removePrefix: "./internal/" },
        },
      },
    });
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/bridge",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/internal/foo.js"), "export const x = 1;\n");
    await writeText(
      path.join(pkgDir, "dist/internal/foo.d.ts"),
      "export declare const x: number;\n",
    );

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["./foo"]).toBeDefined();
    expect(pkg.exports["./internal/foo"]).toBeUndefined();
  });

  it("merges customExports for the package", async () => {
    const root = await makeTempRoot();
    const rel = "packages/custom";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(root, "codefast.config.json"), {
      mirror: {
        customExports: {
          [rel]: { "./extra": "./dist/extra.json" },
        },
      },
    });
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/custom",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["./extra"]).toBe("./dist/extra.json");
    expect(pkg.exports["."]).toBeDefined();
  });

  it("emits CSS wildcard exports for a css-only subfolder when cssExports is enabled", async () => {
    const root = await makeTempRoot();
    const rel = "packages/styles";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(root, "codefast.config.json"), {
      mirror: {
        cssExports: {
          [rel]: { enabled: true },
        },
      },
    });
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/styles",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/theme/a.css"), "a {}\n");
    await writeText(path.join(pkgDir, "dist/theme/b.css"), "b {}\n");

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
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
    await writeJson(path.join(root, "codefast.config.json"), {
      mirror: {
        cssExports: {
          [rel]: { enabled: true, forceExportFiles: true },
        },
      },
    });
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/styles2",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/blocks/x.css"), "x {}\n");
    await writeText(path.join(pkgDir, "dist/blocks/y.css"), "y {}\n");

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
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
    await writeJson(path.join(root, "codefast.config.json"), {
      mirror: {
        cssExports: {
          [rel]: false,
        },
      },
    });
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/nocss",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/root.css"), "r {}\n");

    const code = await runMirrorSync({
      rootDir: root,
      noColor: true,
      packageFilter: rel,
      verbose: true,
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
    await writeJson(path.join(root, "codefast.config.json"), {
      mirror: { skipPackages: [rel] },
    });
    await writeJson(path.join(pkgDir, "package.json"), { name: "@fixture/skip", version: "0.0.0" });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
    expect(code).toBe(0);

    const raw = await fs.readFile(path.join(pkgDir, "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { exports?: unknown };
    expect(pkg.exports).toBeUndefined();
    expect(joinedStdout()).toContain("Skipped");
  });

  it("reads mirror section from legacy generate-exports.config.json", async () => {
    const root = await makeTempRoot();
    const rel = "packages/legacy";
    const pkgDir = path.join(root, rel);
    await writeJson(path.join(root, "generate-exports.config.json"), {
      skipPackages: [],
    });
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/legacy",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["."]).toBeDefined();
  });

  it("skips when package.json is missing", async () => {
    const root = await makeTempRoot();
    const rel = "packages/nopkg";
    const pkgDir = path.join(root, rel);
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
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

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("dist/ not found");
  });

  it("returns 0 when no packages/ directory exists", async () => {
    const root = await makeTempRoot();
    const code = await runMirrorSync({ rootDir: root, noColor: true });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("No packages found");
  });

  it("discovers all packages under packages/ when no filter is set", async () => {
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

    const code = await runMirrorSync({ rootDir: root, noColor: true });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("@fixture/alpha");
    expect(joinedStdout()).toContain("@fixture/beta");
  });

  it("returns exit code 1 when package.json is invalid JSON", async () => {
    const root = await makeTempRoot();
    const rel = "packages/broken";
    const pkgDir = path.join(root, rel);
    await writeText(path.join(pkgDir, "package.json"), "{ not json");
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSync({
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

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
    expect(code).toBe(0);

    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(Object.keys(pkg.exports)).toEqual(["./package.json"]);
  });

  it("falls through when codefast.config.js fails to import then reads codefast.config.json", async () => {
    const root = await makeTempRoot();
    const rel = "packages/js-then-json";
    const pkgDir = path.join(root, rel);
    await writeText(path.join(root, "codefast.config.js"), "export default +++");
    await writeJson(path.join(root, "codefast.config.json"), { mirror: {} });
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/jsjson",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("Could not load codefast.config.js");
    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["."]).toBeDefined();
  });

  it("falls through when generate-exports.config.js fails then reads generate-exports.config.json", async () => {
    const root = await makeTempRoot();
    const rel = "packages/legacy-js-json";
    const pkgDir = path.join(root, rel);
    await writeText(path.join(root, "generate-exports.config.js"), "export default +++");
    await writeJson(path.join(root, "generate-exports.config.json"), { skipPackages: [] });
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/legjs",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("Could not load generate-exports.config.js");
    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["."]).toBeDefined();
  });

  it("uses folder basename when package.json is invalid JSON while skipping missing dist", async () => {
    const root = await makeTempRoot();
    const rel = "packages/bad-json-nodist";
    const pkgDir = path.join(root, rel);
    await writeText(path.join(pkgDir, "package.json"), "{ not json");
    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("dist/ not found");
  });

  it("warns but continues when codefast.config.json is invalid", async () => {
    const root = await makeTempRoot();
    const rel = "packages/ok-after-bad-config";
    const pkgDir = path.join(root, rel);
    await writeText(path.join(root, "codefast.config.json"), "{");
    await writeJson(path.join(pkgDir, "package.json"), {
      name: "@fixture/okcfg",
      version: "0.0.0",
    });
    await writeText(path.join(pkgDir, "dist/index.js"), "export {};\n");
    await writeText(path.join(pkgDir, "dist/index.d.ts"), "export {};\n");

    const code = await runMirrorSync({ rootDir: root, noColor: true, packageFilter: rel });
    expect(code).toBe(0);
    expect(joinedStdout()).toContain("Could not parse codefast.config.json");
    const pkg = JSON.parse(await fs.readFile(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["."]).toBeDefined();
  });
});
