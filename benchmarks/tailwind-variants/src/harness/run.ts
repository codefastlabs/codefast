#!/usr/bin/env node
/**
 * Parent harness: rebuild @codefast/tailwind-variants, run each library bench in its own subprocess
 * (order: @codefast/tailwind-variants → tailwind-variants → class-variance-authority), then emit one
 * report with @codefast/tailwind-variants as the pivot.
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
import {
  BENCH_RESULTS_DIR_NAME,
  BENCH_VERBOSE_ENV_KEY,
  OBSERVATIONS_FILE_NAME,
} from "@codefast/benchmark-harness/shared/env-keys";
import type { SubprocessPayload } from "@codefast/benchmark-harness/shared/protocol";

import { CODEFAST_TV, CVA, TAILWIND_VARIANTS } from "#/harness/config";
import { TAILWIND_VARIANTS_COMPARISON_CONSOLE, TAILWIND_VARIANTS_COMPARISON_MARKDOWN } from "#/harness/presentation";

const VERBOSE_MODE_ENABLED = process.env[BENCH_VERBOSE_ENV_KEY] === "1";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function rebuildCodefastTailwindVariantsPackage(): void {
  console.log(`Rebuilding ${CODEFAST_TV.libraryName} before bench…`);
  const startedAtMs = performance.now();
  const result = spawnSync("pnpm", ["--filter", CODEFAST_TV.libraryName, "build"], {
    cwd: packageRootDirectory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    throw new Error(`Build failed for ${CODEFAST_TV.libraryName}, exit ${String(result.status)}`);
  }
  const elapsedSeconds = (performance.now() - startedAtMs) / 1000;
  console.log(`Finished rebuild of ${CODEFAST_TV.libraryName} (${elapsedSeconds.toFixed(1)}s wall).`);
}

function buildOutputPaths(): {
  runDirectory: string;
  markdownPath: string;
  jsonlPath: string;
  latestMarkdownPath: string;
  latestJsonlPath: string;
} {
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const benchResultsRoot = join(packageRootDirectory, BENCH_RESULTS_DIR_NAME);
  const runDirectory = join(benchResultsRoot, timestamp);
  return {
    runDirectory,
    markdownPath: join(runDirectory, "report.md"),
    jsonlPath: join(runDirectory, OBSERVATIONS_FILE_NAME),
    latestMarkdownPath: join(benchResultsRoot, "latest.md"),
    latestJsonlPath: join(benchResultsRoot, "latest.jsonl"),
  };
}

async function main(): Promise<void> {
  console.log(
    `\n@codefast/benchmark-tailwind-variants — each library runs in its own subprocess; ` +
      `comparisons are ${CODEFAST_TV.libraryName} vs ${TAILWIND_VARIANTS.libraryName} and vs ${CVA.libraryName}.\n`,
  );
  if (!VERBOSE_MODE_ENABLED) {
    console.log(
      `[bench] Quiet mode: child stdout is suppressed; per-scenario progress streams on stderr ` +
        `(\`[${CODEFAST_TV.scenarioName}]\` / \`[${TAILWIND_VARIANTS.scenarioName}]\` / \`[${CVA.scenarioName}]\`). Use \`${BENCH_VERBOSE_ENV_KEY}=1\` for full child stdout.\n`,
    );
  }

  rebuildCodefastTailwindVariantsPackage();

  const runSubprocess = isIsolatedBenchRunRequested() ? runBenchSubprocessIsolated : runBenchSubprocess;
  const codefastPayload: SubprocessPayload = await runSubprocess({
    packageRootDirectory,
    tsconfigFileName: CODEFAST_TV.tsconfigFileName,
    benchEntryFileNameUnderSrc: CODEFAST_TV.benchEntryFileName,
    harnessLabel: CODEFAST_TV.libraryName,
    scenarioName: CODEFAST_TV.scenarioName,
    forwardChildStdoutVerbose: VERBOSE_MODE_ENABLED,
  });

  const tailwindVariantsPayload: SubprocessPayload = await runSubprocess({
    packageRootDirectory,
    tsconfigFileName: CODEFAST_TV.tsconfigFileName,
    benchEntryFileNameUnderSrc: TAILWIND_VARIANTS.benchEntryFileName,
    harnessLabel: TAILWIND_VARIANTS.libraryName,
    scenarioName: TAILWIND_VARIANTS.scenarioName,
    forwardChildStdoutVerbose: VERBOSE_MODE_ENABLED,
  });

  const classVarianceAuthorityPayload: SubprocessPayload = await runSubprocess({
    packageRootDirectory,
    tsconfigFileName: CODEFAST_TV.tsconfigFileName,
    benchEntryFileNameUnderSrc: CVA.benchEntryFileName,
    harnessLabel: CVA.libraryName,
    scenarioName: CVA.scenarioName,
    forwardChildStdoutVerbose: VERBOSE_MODE_ENABLED,
  });

  const codefastReport: LibraryReport = buildLibraryReport(
    codefastPayload.fingerprint,
    codefastPayload.trials,
    codefastPayload.sanityFailures,
  );
  const tailwindVariantsReport: LibraryReport = buildLibraryReport(
    tailwindVariantsPayload.fingerprint,
    tailwindVariantsPayload.trials,
    tailwindVariantsPayload.sanityFailures,
  );
  const classVarianceAuthorityReport: LibraryReport = buildLibraryReport(
    classVarianceAuthorityPayload.fingerprint,
    classVarianceAuthorityPayload.trials,
    classVarianceAuthorityPayload.sanityFailures,
  );

  const codefastLibrary: ComparisonLibrary = {
    report: codefastReport,
    displayName: CODEFAST_TV.libraryName,
    shortName: "cf",
  };
  const tailwindVariantsLibrary: ComparisonLibrary = {
    report: tailwindVariantsReport,
    displayName: TAILWIND_VARIANTS.libraryName,
    shortName: "tv",
  };
  const classVarianceAuthorityLibrary: ComparisonLibrary = {
    report: classVarianceAuthorityReport,
    displayName: CVA.libraryName,
    shortName: "cva",
  };

  const competitors = [tailwindVariantsLibrary, classVarianceAuthorityLibrary];
  renderComparisonConsoleReport(codefastLibrary, competitors, TAILWIND_VARIANTS_COMPARISON_CONSOLE);

  const librariesForJsonl = [
    { fingerprint: codefastPayload.fingerprint, trials: codefastPayload.trials },
    { fingerprint: tailwindVariantsPayload.fingerprint, trials: tailwindVariantsPayload.trials },
    {
      fingerprint: classVarianceAuthorityPayload.fingerprint,
      trials: classVarianceAuthorityPayload.trials,
    },
  ];

  const markdown = renderComparisonMarkdownReport(codefastLibrary, competitors, TAILWIND_VARIANTS_COMPARISON_MARKDOWN);
  const outputPaths = buildOutputPaths();
  writeMarkdownFile(outputPaths.markdownPath, markdown);
  writeJsonlRun(outputPaths.jsonlPath, librariesForJsonl);

  writeMarkdownFile(outputPaths.latestMarkdownPath, markdown);
  writeJsonlRun(outputPaths.latestJsonlPath, librariesForJsonl);

  console.log(`Run directory: ${outputPaths.runDirectory}`);
  console.log(`Markdown report: ${outputPaths.markdownPath}`);
  console.log(`JSONL observations: ${outputPaths.jsonlPath}`);
  console.log(`Also mirrored to latest: ${outputPaths.latestMarkdownPath}, ${outputPaths.latestJsonlPath}`);
}

main().catch((caught: unknown) => {
  const message = caught instanceof Error ? caught.message : String(caught);
  console.error(`\nBenchmark run failed: ${message}`);
  if (caught instanceof Error && caught.stack !== undefined) {
    console.error(caught.stack);
  }
  process.exitCode = resolveBenchParentExitCode(caught);
});
