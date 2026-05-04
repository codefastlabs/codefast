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
 * The subprocess contract lives in `@codefast/benchmark-harness`. Any scenario
 * list change only touches the child processes; this file is stable.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildLibraryReport,
  type LibraryReport,
  renderTwoWayConsoleReport,
  renderTwoWayMarkdownReport,
  resolveBenchParentExitCode,
  runBenchSubprocess,
  type SubprocessPayload,
  writeJsonlRun,
  writeMarkdownFile,
} from "@codefast/benchmark-harness";
import { DI_INVERSIFY_CONSOLE, DI_INVERSIFY_MARKDOWN } from "#/harness/presentation";

const INVERSIFY_LIBRARY_DISPLAY_NAME = "InversifyJS 8";
const CODEFAST_DI_LIBRARY_DISPLAY_NAME = "@codefast/di";
const CODEFAST_DI_PACKAGE_FILTER = "@codefast/di";
const VERBOSE_MODE_ENABLED = process.env["BENCH_VERBOSE"] === "1";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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
  if (!VERBOSE_MODE_ENABLED) {
    console.log(
      "[bench] Quiet mode: child stdout is suppressed; per-scenario progress still streams on stderr (prefixed `[codefast]` / `[inversify]`). Use `BENCH_VERBOSE=1` (or `pnpm bench:verbose`) for full child stdout.\n",
    );
  }

  rebuildCodefastDiPackage();

  const codefastPayload: SubprocessPayload = await runBenchSubprocess({
    packageRootDirectory,
    tsconfigFileName: "tsconfig.codefast.json",
    benchEntryFileNameUnderSrc: "codefast-benches.ts",
    harnessLabel: CODEFAST_DI_LIBRARY_DISPLAY_NAME,
    scenarioName: "codefast",
    forwardChildStdoutVerbose: VERBOSE_MODE_ENABLED,
  });
  const inversifyPayload: SubprocessPayload = await runBenchSubprocess({
    packageRootDirectory,
    tsconfigFileName: "tsconfig.inversify.json",
    benchEntryFileNameUnderSrc: "inversify-benches.ts",
    harnessLabel: INVERSIFY_LIBRARY_DISPLAY_NAME,
    scenarioName: "inversify",
    forwardChildStdoutVerbose: VERBOSE_MODE_ENABLED,
  });

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

  renderTwoWayConsoleReport(codefastReport, inversifyReport, DI_INVERSIFY_CONSOLE, {
    footerHintLine: `Cite the 'Comparable scenarios' table.`,
  });

  const librariesForJsonl = [
    { fingerprint: codefastPayload.fingerprint, trials: codefastPayload.trials },
    { fingerprint: inversifyPayload.fingerprint, trials: inversifyPayload.trials },
  ];

  const markdown = renderTwoWayMarkdownReport(
    codefastReport,
    inversifyReport,
    DI_INVERSIFY_MARKDOWN,
  );

  const outputPaths = buildOutputPaths();
  writeMarkdownFile(outputPaths.markdownPath, markdown);
  writeJsonlRun(outputPaths.jsonlPath, librariesForJsonl);

  writeMarkdownFile(outputPaths.latestMarkdownPath, markdown);
  writeJsonlRun(outputPaths.latestJsonlPath, librariesForJsonl);

  console.log(`Markdown report: ${outputPaths.markdownPath}`);
  console.log(`JSONL observations: ${outputPaths.jsonlPath}`);
  console.log(
    `Also mirrored to: ${outputPaths.latestMarkdownPath}, ${outputPaths.latestJsonlPath}`,
  );
}

main().catch((caught: unknown) => {
  const message = caught instanceof Error ? caught.message : String(caught);
  console.error(`\nBenchmark run failed: ${message}`);
  if (caught instanceof Error && caught.stack !== undefined) {
    console.error(caught.stack);
  }
  process.exitCode = resolveBenchParentExitCode(caught);
});
