#!/usr/bin/env node
/**
 * Parent harness: rebuild @codefast/tailwind-variants, run each library bench in its own subprocess
 * (order: @codefast/tailwind-variants → tailwind-variants → class-variance-authority), then emit
 * pairwise reports vs @codefast/tailwind-variants for tailwind-variants and for cva.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BENCH_RESULTS_DIR_NAME,
  BENCH_VERBOSE_ENV_KEY,
  buildLibraryReport,
  type LibraryReport,
  OBSERVATIONS_FILE_NAME,
  renderTwoWayConsoleReport,
  renderTwoWayMarkdownReport,
  resolveBenchParentExitCode,
  runBenchSubprocess,
  type SubprocessPayload,
  writeJsonlRun,
  writeMarkdownFile,
} from "@codefast/benchmark-harness";
import {
  CODEFAST_VS_CVA_CONSOLE,
  CODEFAST_VS_CVA_MARKDOWN,
  CODEFAST_VS_TAILWIND_VARIANTS_CONSOLE,
  CODEFAST_VS_TAILWIND_VARIANTS_MARKDOWN,
} from "#/harness/presentation";
import { CODEFAST_TV, CVA, TAILWIND_VARIANTS } from "#/harness/config";

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
  console.log(
    `Finished rebuild of ${CODEFAST_TV.libraryName} (${elapsedSeconds.toFixed(1)}s wall).`,
  );
}

function buildOutputPaths(): {
  runDirectory: string;
  vsTailwindVariantsMarkdownPath: string;
  vsClassVarianceAuthorityMarkdownPath: string;
  combinedMarkdownPath: string;
  jsonlPath: string;
  latestVsTailwindVariantsMarkdownPath: string;
  latestVsCvaMarkdownPath: string;
  latestCombinedMarkdownPath: string;
  latestJsonlPath: string;
} {
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const benchResultsRoot = join(packageRootDirectory, BENCH_RESULTS_DIR_NAME);
  const runDirectory = join(benchResultsRoot, timestamp);
  return {
    runDirectory,
    vsTailwindVariantsMarkdownPath: join(runDirectory, "report-vs-tailwind-variants.md"),
    vsClassVarianceAuthorityMarkdownPath: join(
      runDirectory,
      "report-vs-class-variance-authority.md",
    ),
    combinedMarkdownPath: join(runDirectory, "report.md"),
    jsonlPath: join(runDirectory, OBSERVATIONS_FILE_NAME),
    latestVsTailwindVariantsMarkdownPath: join(benchResultsRoot, "latest-vs-tailwind-variants.md"),
    latestVsCvaMarkdownPath: join(benchResultsRoot, "latest-vs-class-variance-authority.md"),
    latestCombinedMarkdownPath: join(benchResultsRoot, "latest.md"),
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

  const codefastPayload: SubprocessPayload = await runBenchSubprocess({
    packageRootDirectory,
    tsconfigFileName: CODEFAST_TV.tsconfigFileName,
    benchEntryFileNameUnderSrc: CODEFAST_TV.benchEntryFileName,
    harnessLabel: CODEFAST_TV.libraryName,
    scenarioName: CODEFAST_TV.scenarioName,
    forwardChildStdoutVerbose: VERBOSE_MODE_ENABLED,
  });

  const tailwindVariantsPayload: SubprocessPayload = await runBenchSubprocess({
    packageRootDirectory,
    tsconfigFileName: CODEFAST_TV.tsconfigFileName,
    benchEntryFileNameUnderSrc: TAILWIND_VARIANTS.benchEntryFileName,
    harnessLabel: TAILWIND_VARIANTS.libraryName,
    scenarioName: TAILWIND_VARIANTS.scenarioName,
    forwardChildStdoutVerbose: VERBOSE_MODE_ENABLED,
  });

  const classVarianceAuthorityPayload: SubprocessPayload = await runBenchSubprocess({
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

  console.log(
    `\n--- Pairwise: ${CODEFAST_TV.libraryName} vs ${TAILWIND_VARIANTS.libraryName} ---\n`,
  );
  renderTwoWayConsoleReport(
    codefastReport,
    tailwindVariantsReport,
    CODEFAST_VS_TAILWIND_VARIANTS_CONSOLE,
    { footerHintLine: "Markdown: report-vs-tailwind-variants.md in the run directory." },
  );

  console.log(`\n--- Pairwise: ${CODEFAST_TV.libraryName} vs ${CVA.libraryName} ---\n`);
  renderTwoWayConsoleReport(codefastReport, classVarianceAuthorityReport, CODEFAST_VS_CVA_CONSOLE, {
    footerHintLine: "Markdown: report-vs-class-variance-authority.md in the run directory.",
  });

  const librariesForJsonl = [
    { fingerprint: codefastPayload.fingerprint, trials: codefastPayload.trials },
    { fingerprint: tailwindVariantsPayload.fingerprint, trials: tailwindVariantsPayload.trials },
    {
      fingerprint: classVarianceAuthorityPayload.fingerprint,
      trials: classVarianceAuthorityPayload.trials,
    },
  ];

  const vsTailwindVariantsMarkdown = renderTwoWayMarkdownReport(
    codefastReport,
    tailwindVariantsReport,
    CODEFAST_VS_TAILWIND_VARIANTS_MARKDOWN,
  );
  const vsCvaMarkdown = renderTwoWayMarkdownReport(
    codefastReport,
    classVarianceAuthorityReport,
    CODEFAST_VS_CVA_MARKDOWN,
  );
  const combinedMarkdown = `${vsTailwindVariantsMarkdown}\n\n---\n\n${vsCvaMarkdown}\n`;

  const outputPaths = buildOutputPaths();
  writeMarkdownFile(outputPaths.vsTailwindVariantsMarkdownPath, vsTailwindVariantsMarkdown);
  writeMarkdownFile(outputPaths.vsClassVarianceAuthorityMarkdownPath, vsCvaMarkdown);
  writeMarkdownFile(outputPaths.combinedMarkdownPath, combinedMarkdown);
  writeJsonlRun(outputPaths.jsonlPath, librariesForJsonl);

  writeMarkdownFile(outputPaths.latestVsTailwindVariantsMarkdownPath, vsTailwindVariantsMarkdown);
  writeMarkdownFile(outputPaths.latestVsCvaMarkdownPath, vsCvaMarkdown);
  writeMarkdownFile(outputPaths.latestCombinedMarkdownPath, combinedMarkdown);
  writeJsonlRun(outputPaths.latestJsonlPath, librariesForJsonl);

  console.log(`Run directory: ${outputPaths.runDirectory}`);
  console.log(`Markdown (pair): ${outputPaths.vsTailwindVariantsMarkdownPath}`);
  console.log(`Markdown (pair): ${outputPaths.vsClassVarianceAuthorityMarkdownPath}`);
  console.log(`Markdown (combined): ${outputPaths.combinedMarkdownPath}`);
  console.log(`JSONL observations: ${outputPaths.jsonlPath}`);
  console.log(
    `Also mirrored to latest: ${outputPaths.latestVsTailwindVariantsMarkdownPath}, ${outputPaths.latestVsCvaMarkdownPath}, ${outputPaths.latestCombinedMarkdownPath}, ${outputPaths.latestJsonlPath}`,
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
