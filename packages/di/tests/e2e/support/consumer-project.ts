/**
 * A throwaway consumer project that reaches `@codefast/di` through `node_modules`, so every lane takes the package's
 * `exports` and `imports` into the built `dist`, never the repo's `source` lane.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// A cold tsc or tsx start on a saturated machine can outlive the default test timeout.
export const SUBPROCESS_TEST_TIMEOUT_MS = 60_000;
const SUBPROCESS_KILL_AFTER_MS = 45_000;

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const require = createRequire(import.meta.url);
// TypeScript 7's `tsc` is a native binary behind an ESM launcher, and the package exports no `bin`.
const tscLauncher = join(dirname(require.resolve("typescript/package.json")), "bin", "tsc");
const tsxLoader = pathToFileURL(require.resolve("tsx/esm")).href;

export interface ProcessRun {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error: string | undefined;
}

export interface ConsumerProject {
  /** Runs one entry under tsx, which lowers the decorators with esbuild as it loads. */
  runTsx(entry: string): ProcessRun;
  /** Compiles `src/` with `tsc` into `outDir`, throwing with the diagnostics when it reports any. */
  compile(outDir: string, compilerOptions: Readonly<Record<string, unknown>>): void;
  /** Runs one compiled entry on a bare Node. */
  runNode(entry: string): ProcessRun;
  remove(): void;
}

/** Creates a consumer project with `fixtureDir` as its `src/`, building the package first when `dist` is missing. */
export function createConsumerProject(fixtureDir: string): ConsumerProject {
  if (!existsSync(join(packageRoot, "dist", "index.js"))) {
    execFileSync("pnpm", ["build"], { cwd: packageRoot, stdio: "ignore" });
  }
  const dir = mkdtempSync(join(tmpdir(), "di-consumer-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "consumer", private: true, type: "module" }));
  cpSync(fixtureDir, join(dir, "src"), { recursive: true });
  mkdirSync(join(dir, "node_modules", "@codefast"), { recursive: true });
  symlinkSync(packageRoot, join(dir, "node_modules", "@codefast", "di"), "dir");

  const spawn = (args: ReadonlyArray<string>): ProcessRun => {
    const result = spawnSync(process.execPath, args, { cwd: dir, encoding: "utf8", timeout: SUBPROCESS_KILL_AFTER_MS });
    return { status: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message };
  };

  return {
    runTsx: (entry) => spawn(["--import", tsxLoader, join(dir, entry)]),
    compile(outDir, compilerOptions) {
      const tsconfigPath = join(dir, `tsconfig.${outDir}.json`);
      writeFileSync(
        tsconfigPath,
        JSON.stringify({
          compilerOptions: { ...compilerOptions, rootDir: "./src", outDir: `./${outDir}` },
          include: ["src/**/*.ts"],
        }),
      );
      const result = spawn([tscLauncher, "-p", tsconfigPath]);
      if (result.status !== 0) {
        throw new Error(`tsc exited ${String(result.status)} for ${outDir}:\n${result.stdout}${result.stderr}`);
      }
    },
    runNode: (entry) => spawn([join(dir, entry)]),
    remove: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
