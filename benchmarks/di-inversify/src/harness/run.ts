#!/usr/bin/env node
/**
 * Parent harness. Responsibilities:
 *
 * 1. Rebuild `@codefast/di` so the bench sees the latest source changes.
 * 2. Spawn each library's bench entry in its own subprocess, under its own
 *    tsconfig, with a pinned environment — no `NODE_ENV=development`, no
 *    accidental inherit of CI-specific flags.
 * 3. Parse the START/END-framed `SubprocessPayload` from stdout and turn it
 *    into a `LibraryReport`.
 * 4. Emit three outputs: a markdown report under `bench-results/`, a JSONL
 *    file alongside it, and an aligned ASCII table on stdout.
 *
 * The subprocess contract lives in `protocol.ts`. Any scenario list change
 * only touches the child processes; this file is stable.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SubprocessPayload } from "./protocol";
import {
  BENCH_RESULT_JSON_END,
  BENCH_RESULT_JSON_START,
  extractSubprocessPayload,
} from "./protocol";
import type { LibraryReport } from "./report";
import {
  buildLibraryReport,
  renderConsoleReport,
  writeJsonlRun,
  writeMarkdownReport,
} from "./report";

const INVERSIFY_LIBRARY_DISPLAY_NAME = "InversifyJS 8";
const CODEFAST_DI_LIBRARY_DISPLAY_NAME = "@codefast/di";
const CODEFAST_DI_PACKAGE_FILTER = "@codefast/di";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Environment pinned across both subprocesses. `NODE_OPTIONS` is where the
 * real leverage lives: `--expose-gc` unlocks the `beforeEach` GC hook that
 * stabilises allocation-heavy scenarios, and `--no-warnings` suppresses
 * Node's experimental-decorators deprecation chatter so it never ends up
 * in the captured stdout (which would be a parser hazard even with the
 * framing markers in place).
 */
function buildSubprocessEnvironment(): NodeJS.ProcessEnv {
  const parentEnvironment = process.env;
  const existingNodeOptions = parentEnvironment["NODE_OPTIONS"] ?? "";
  const requiredFlags = ["--expose-gc", "--no-warnings"];
  const mergedNodeOptions = [existingNodeOptions, ...requiredFlags]
    .filter((segment) => segment.trim().length > 0)
    .join(" ");
  return {
    ...parentEnvironment,
    NODE_ENV: "production",
    NODE_OPTIONS: mergedNodeOptions,
  };
}

function rebuildCodefastDiPackage(): void {
  console.log(`Rebuilding ${CODEFAST_DI_LIBRARY_DISPLAY_NAME} before bench…`);
  const startedAtMs = performance.now();
  const result = spawnSync("pnpm", ["--filter", CODEFAST_DI_PACKAGE_FILTER, "build"], {
    cwd: packageRootDirectory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    throw new Error(
      `Build failed for ${CODEFAST_DI_LIBRARY_DISPLAY_NAME}, exit ${String(result.status)}`,
    );
  }
  const elapsedSeconds = (performance.now() - startedAtMs) / 1000;
  console.log(
    `Finished rebuild of ${CODEFAST_DI_LIBRARY_DISPLAY_NAME} (${elapsedSeconds.toFixed(1)}s wall).`,
  );
}

/**
 * Runs one bench subprocess end-to-end. Passes the subprocess's stdout
 * through to the parent's stdout *only* if no framing markers are found —
 * if framing is intact we assume the subprocess succeeded and suppress its
 * internal chatter so the comparison table isn't buried.
 */
function runSubprocess(
  tsconfigFileName: string,
  benchEntryFileName: string,
  harnessLabel: string,
): SubprocessPayload {
  console.log(`\nRunning ${harnessLabel} subprocess: ${benchEntryFileName}…`);
  const startedAtMs = performance.now();

  const spawnResult = spawnSync(
    "pnpm",
    ["exec", "tsx", "--tsconfig", tsconfigFileName, join("src", benchEntryFileName)],
    {
      cwd: packageRootDirectory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: buildSubprocessEnvironment(),
    },
  );

  const elapsedSeconds = (performance.now() - startedAtMs) / 1000;
  console.log(
    `${harnessLabel} subprocess finished in ${elapsedSeconds.toFixed(1)}s wall (exit ${String(spawnResult.status)}).`,
  );

  if (spawnResult.status !== 0) {
    console.error("--- subprocess stderr ---");
    console.error(spawnResult.stderr);
    console.error("--- subprocess stdout ---");
    console.error(spawnResult.stdout);
    throw new Error(
      `${harnessLabel} subprocess failed (${benchEntryFileName}), exit ${String(spawnResult.status)}`,
    );
  }

  const hasStartMarker = spawnResult.stdout.includes(BENCH_RESULT_JSON_START);
  const hasEndMarker = spawnResult.stdout.includes(BENCH_RESULT_JSON_END);
  if (!hasStartMarker || !hasEndMarker) {
    console.error("--- subprocess stderr ---");
    console.error(spawnResult.stderr);
    console.error("--- subprocess stdout (missing framing markers) ---");
    console.error(spawnResult.stdout);
    throw new Error(
      `${harnessLabel} subprocess stdout did not contain ${BENCH_RESULT_JSON_START}/${BENCH_RESULT_JSON_END}; cannot parse result.`,
    );
  }

  const payload = extractSubprocessPayload(spawnResult.stdout);
  if (payload === undefined) {
    console.error("--- subprocess stderr ---");
    console.error(spawnResult.stderr);
    console.error("--- subprocess stdout (framing markers present but JSON invalid) ---");
    console.error(spawnResult.stdout);
    throw new Error(
      `${harnessLabel} subprocess returned framing markers but the enclosed JSON failed to parse.`,
    );
  }

  return payload;
}

/**
 * Build the timestamped output directory for this run. We date stamp every
 * run so historical comparisons are never clobbered; the short-lived
 * `latest` symlink-style file gives CI a stable filename to diff against.
 */
function buildOutputPaths(): {
  markdownPath: string;
  jsonlPath: string;
  latestMarkdownPath: string;
  latestJsonlPath: string;
} {
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const runDirectory = join(packageRootDirectory, "bench-results", timestamp);
  return {
    markdownPath: join(runDirectory, "report.md"),
    jsonlPath: join(runDirectory, "observations.jsonl"),
    latestMarkdownPath: join(packageRootDirectory, "bench-results", "latest.md"),
    latestJsonlPath: join(packageRootDirectory, "bench-results", "latest.jsonl"),
  };
}

async function main(): Promise<void> {
  console.log(
    "\n@codefast/benchmark-di-inversify — head-to-head bench, each library in its canonical decorator mode.",
  );
  console.log("  @codefast/di  : TC39 Stage 3 decorators + Symbol.metadata");
  console.log("  InversifyJS 8 : legacy experimental decorators + reflect-metadata");
  console.log("Each library runs N trials; the table reports per-trial medians and IQR.\n");

  rebuildCodefastDiPackage();

  const codefastPayload = runSubprocess(
    "tsconfig.codefast.json",
    "codefast-benches.ts",
    CODEFAST_DI_LIBRARY_DISPLAY_NAME,
  );
  const inversifyPayload = runSubprocess(
    "tsconfig.inversify.json",
    "inversify-benches.ts",
    INVERSIFY_LIBRARY_DISPLAY_NAME,
  );

  const codefastReport: LibraryReport = buildLibraryReport(
    codefastPayload.fingerprint,
    codefastPayload.trials,
    codefastPayload.sanityFailures,
  );
  const inversifyReport: LibraryReport = buildLibraryReport(
    inversifyPayload.fingerprint,
    inversifyPayload.trials,
    inversifyPayload.sanityFailures,
  );

  renderConsoleReport(codefastReport, inversifyReport);

  const outputPaths = buildOutputPaths();
  writeMarkdownReport(outputPaths.markdownPath, codefastReport, inversifyReport);
  writeJsonlRun(
    outputPaths.jsonlPath,
    codefastPayload.fingerprint,
    codefastPayload.trials,
    inversifyPayload.fingerprint,
    inversifyPayload.trials,
  );
  // Mirror to `latest.*` for stable paths in tooling / CI.
  writeMarkdownReport(outputPaths.latestMarkdownPath, codefastReport, inversifyReport);
  writeJsonlRun(
    outputPaths.latestJsonlPath,
    codefastPayload.fingerprint,
    codefastPayload.trials,
    inversifyPayload.fingerprint,
    inversifyPayload.trials,
  );

  console.log("");
  console.log(`Markdown report: ${outputPaths.markdownPath}`);
  console.log(`JSONL observations: ${outputPaths.jsonlPath}`);
  console.log(
    `Also mirrored to: ${outputPaths.latestMarkdownPath}, ${outputPaths.latestJsonlPath}`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nBenchmark run failed: ${message}`);
  if (error instanceof Error && error.stack !== undefined) {
    console.error(error.stack);
  }
  process.exitCode = 1;
});
