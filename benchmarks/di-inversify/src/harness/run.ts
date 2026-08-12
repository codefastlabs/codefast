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
import type { RunBenchSubprocessParameters } from "@codefast/benchmark-harness/parent/run-bench-subprocess";
import {
  isIsolatedBenchRunRequested,
  runBenchSubprocess,
  runBenchSubprocessesInterleaved,
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
  BENCH_ONLY_ENV_KEY,
  BENCH_RESULTS_DIR_NAME,
  BENCH_VERBOSE_ENV_KEY,
  OBSERVATIONS_FILE_NAME,
  parseScenarioFilter,
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

function subprocessParametersFor(config: BenchSubprocessConfig): RunBenchSubprocessParameters {
  return {
    packageRootDirectory,
    tsconfigFileName: config.tsconfigFileName,
    benchEntryFileNameUnderSrc: config.benchEntryFileName,
    harnessLabel: resolveDisplayName(config),
    scenarioName: config.scenarioName,
    forwardChildStdoutVerbose: VERBOSE_MODE_ENABLED,
  };
}

const INTERLEAVED_RUN_ORDER =
  "interleaved — every library runs a scenario before the next scenario starts, rotating which goes first";
const LIBRARY_MAJOR_RUN_ORDER =
  "library-major — each library's whole suite runs before the next starts, so drift over the run lands on whoever ran later; cross-library ratios from this profile are provisional";

/**
 * Every library's payload, keyed by library name.
 *
 * @remarks Isolated runs interleave, because a cross-library ratio is only as good as the gap between
 * the two measurements it divides. Without isolation there is one process per library and nothing to
 * interleave, so that profile keeps its caveat.
 */
async function runEveryLibrary(
  configs: ReadonlyArray<BenchSubprocessConfig>,
): Promise<{ payloads: Map<string, SubprocessPayload>; runOrder: string }> {
  if (isIsolatedBenchRunRequested()) {
    return {
      payloads: await runBenchSubprocessesInterleaved(
        configs.map((config) => ({ key: config.libraryName, parameters: subprocessParametersFor(config) })),
      ),
      runOrder: INTERLEAVED_RUN_ORDER,
    };
  }
  const payloads = new Map<string, SubprocessPayload>();
  for (const config of configs) {
    payloads.set(config.libraryName, await runBenchSubprocess(subprocessParametersFor(config)));
  }
  return { payloads, runOrder: LIBRARY_MAJOR_RUN_ORDER };
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

  const { payloads, runOrder } = await runEveryLibrary([CODEFAST_DI, INVERSIFY, AWILIX, TSYRINGE]);
  const codefastPayload = payloads.get(CODEFAST_DI.libraryName)!;
  const inversifyPayload = payloads.get(INVERSIFY.libraryName)!;
  const awilixPayload = payloads.get(AWILIX.libraryName)!;
  const tsyringePayload = payloads.get(TSYRINGE.libraryName)!;
  console.log(`\n[bench] Run order: ${runOrder}`);

  // A competitor may implement none of the requested rows and measure nothing; the subject may not,
  // since then the run has nothing to report and the likeliest cause is a mistyped id.
  if (
    parseScenarioFilter(process.env[BENCH_ONLY_ENV_KEY]) !== undefined &&
    codefastPayload.trials.every((trial) => trial.scenarios.length === 0)
  ) {
    throw new Error(
      `${BENCH_ONLY_ENV_KEY}="${process.env[BENCH_ONLY_ENV_KEY] ?? ""}" matched no scenario in ${CODEFAST_DI.libraryName}.`,
    );
  }

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

  const markdown = renderComparisonMarkdownReport(codefastLibrary, competitors, {
    ...DI_COMPARISON_MARKDOWN,
    runOrder,
  });

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
