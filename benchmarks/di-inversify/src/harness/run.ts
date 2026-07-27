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

import { resolveBenchParentExitCode } from "@codefast/benchmark-harness/parent/resolve-bench-parent-exit-code";
import {
  isIsolatedBenchRunRequested,
  runBenchSubprocess,
  runBenchSubprocessIsolated,
} from "@codefast/benchmark-harness/parent/run-bench-subprocess";
import { buildLibraryReport, type LibraryReport } from "@codefast/benchmark-harness/report/aggregate";
import type { ComparisonLibrary } from "@codefast/benchmark-harness/report/comparison";
import {
  renderComparisonConsoleReport,
  renderComparisonMarkdownReport,
} from "@codefast/benchmark-harness/report/comparison";
import { writeJsonlRun, writeMarkdownFile } from "@codefast/benchmark-harness/report/write";
import { type BenchSubprocessConfig, resolveDisplayName } from "@codefast/benchmark-harness/shared/config";
import {
  BENCH_RESULTS_DIR_NAME,
  BENCH_VERBOSE_ENV_KEY,
  OBSERVATIONS_FILE_NAME,
} from "@codefast/benchmark-harness/shared/env-keys";
import type { SubprocessPayload } from "@codefast/benchmark-harness/shared/protocol";

import { AWILIX, CODEFAST_DI, INVERSIFY, TSYRINGE } from "#/harness/config";
import { DI_COMPARISON_CONSOLE, DI_COMPARISON_MARKDOWN } from "#/harness/presentation";

const VERBOSE_MODE_ENABLED = process.env[BENCH_VERBOSE_ENV_KEY] === "1";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function rebuildCodefastDiPackage(): void {
  console.log(`Rebuilding ${CODEFAST_DI.libraryName} before bench…`);
  const startedAtMs = performance.now();
  const result = spawnSync("pnpm", ["--filter", CODEFAST_DI.libraryName, "build"], {
    cwd: packageRootDirectory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    throw new Error(`Build failed for ${CODEFAST_DI.libraryName}, exit ${String(result.status)}`);
  }
  const elapsedSeconds = (performance.now() - startedAtMs) / 1000;
  console.log(`Finished rebuild of ${CODEFAST_DI.libraryName} (${elapsedSeconds.toFixed(1)}s wall).`);
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
  const benchResultsRoot = join(packageRootDirectory, BENCH_RESULTS_DIR_NAME);
  const runDirectory = join(benchResultsRoot, timestamp);
  return {
    markdownPath: join(runDirectory, "report.md"),
    jsonlPath: join(runDirectory, OBSERVATIONS_FILE_NAME),
    latestMarkdownPath: join(benchResultsRoot, "latest.md"),
    latestJsonlPath: join(benchResultsRoot, "latest.jsonl"),
  };
}

async function runLibrary(
  runSubprocess: typeof runBenchSubprocess,
  config: BenchSubprocessConfig,
): Promise<SubprocessPayload> {
  return runSubprocess({
    packageRootDirectory,
    tsconfigFileName: config.tsconfigFileName,
    benchEntryFileNameUnderSrc: config.benchEntryFileName,
    harnessLabel: resolveDisplayName(config),
    scenarioName: config.scenarioName,
    forwardChildStdoutVerbose: VERBOSE_MODE_ENABLED,
  });
}

async function main(): Promise<void> {
  console.log("\n@codefast/benchmark-di-inversify — head-to-head bench, each library in its canonical decorator mode.");
  console.log(`  ${CODEFAST_DI.libraryName}  : TC39 Stage 3 decorators + Symbol.metadata`);
  console.log(`  ${resolveDisplayName(INVERSIFY)} : legacy experimental decorators + reflect-metadata`);
  console.log("Each library runs N trials; the table reports per-trial medians and IQR.\n");
  if (!VERBOSE_MODE_ENABLED) {
    console.log(
      `[bench] Quiet mode: child stdout is suppressed; per-scenario progress still streams on stderr (prefixed \`[${CODEFAST_DI.scenarioName}]\` / \`[${INVERSIFY.scenarioName}]\`). Use \`${BENCH_VERBOSE_ENV_KEY}=1\` (or \`pnpm bench:verbose\`) for full child stdout.\n`,
    );
  }

  rebuildCodefastDiPackage();

  const runSubprocess = isIsolatedBenchRunRequested() ? runBenchSubprocessIsolated : runBenchSubprocess;
  const codefastPayload = await runLibrary(runSubprocess, CODEFAST_DI);
  const inversifyPayload = await runLibrary(runSubprocess, INVERSIFY);
  const awilixPayload = await runLibrary(runSubprocess, AWILIX);
  const tsyringePayload = await runLibrary(runSubprocess, TSYRINGE);

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
  const awilixReport: LibraryReport = buildLibraryReport(
    awilixPayload.fingerprint,
    awilixPayload.trials,
    awilixPayload.sanityFailures,
  );
  const tsyringeReport: LibraryReport = buildLibraryReport(
    tsyringePayload.fingerprint,
    tsyringePayload.trials,
    tsyringePayload.sanityFailures,
  );

  const codefastLibrary: ComparisonLibrary = {
    report: codefastReport,
    displayName: CODEFAST_DI.libraryName,
    shortName: "cf",
  };
  // awilix and tsyringe cover only the core subset, so they read `—` outside it; their
  // head-to-head lines still count only the rows they measured.
  const competitors: ReadonlyArray<ComparisonLibrary> = [
    { report: inversifyReport, displayName: INVERSIFY.libraryName, shortName: "inv" },
    { report: awilixReport, displayName: resolveDisplayName(AWILIX), shortName: "awi" },
    { report: tsyringeReport, displayName: resolveDisplayName(TSYRINGE), shortName: "tsy" },
  ];
  renderComparisonConsoleReport(codefastLibrary, competitors, DI_COMPARISON_CONSOLE);

  const librariesForJsonl = [
    { fingerprint: codefastPayload.fingerprint, trials: codefastPayload.trials },
    { fingerprint: inversifyPayload.fingerprint, trials: inversifyPayload.trials },
    { fingerprint: awilixPayload.fingerprint, trials: awilixPayload.trials },
    { fingerprint: tsyringePayload.fingerprint, trials: tsyringePayload.trials },
  ];

  const markdown = renderComparisonMarkdownReport(codefastLibrary, competitors, DI_COMPARISON_MARKDOWN);

  const outputPaths = buildOutputPaths();
  writeMarkdownFile(outputPaths.markdownPath, markdown);
  writeJsonlRun(outputPaths.jsonlPath, librariesForJsonl);

  writeMarkdownFile(outputPaths.latestMarkdownPath, markdown);
  writeJsonlRun(outputPaths.latestJsonlPath, librariesForJsonl);

  console.log(`Markdown report: ${outputPaths.markdownPath}`);
  console.log(`JSONL observations: ${outputPaths.jsonlPath}`);
  console.log(`Also mirrored to: ${outputPaths.latestMarkdownPath}, ${outputPaths.latestJsonlPath}`);
}

main().catch((caught: unknown) => {
  const message = caught instanceof Error ? caught.message : String(caught);
  console.error(`\nBenchmark run failed: ${message}`);
  if (caught instanceof Error && caught.stack !== undefined) {
    console.error(caught.stack);
  }
  process.exitCode = resolveBenchParentExitCode(caught);
});
