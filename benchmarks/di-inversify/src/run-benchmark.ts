#!/usr/bin/env node
/**
 * Runs InversifyJS 8 and @codefast/di benches (separate TS configs) and prints a comparison table.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type BenchmarkRow = {
  id: string;
  hz: number;
  meanMs: number;
};

/** Full library names for logs and table headers (no abbreviations). */
const INVERSIFY_LIBRARY_DISPLAY_NAME = "InversifyJS 8";
const CODEFAST_DI_LIBRARY_DISPLAY_NAME = "@codefast/di";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");

function runSubBench(
  tsconfigFileName: string,
  benchEntryFileName: string,
  harnessLibraryLabel: string,
): BenchmarkRow[] {
  console.log(`Running benchmark harness: ${harnessLibraryLabel} (${benchEntryFileName})…`);
  const harnessWallStartedAtMs = performance.now();

  const tsxSpawnResult = spawnSync(
    "pnpm",
    ["exec", "tsx", "--tsconfig", tsconfigFileName, join("src", benchEntryFileName)],
    {
      cwd: packageRootDirectory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    },
  );
  if (tsxSpawnResult.status !== 0) {
    console.error(tsxSpawnResult.stderr || tsxSpawnResult.stdout);
    throw new Error(
      `Sub-benchmark failed (${benchEntryFileName}), exit ${String(tsxSpawnResult.status)}`,
    );
  }
  const lastNonEmptyStdoutLine = tsxSpawnResult.stdout.trim().split("\n").filter(Boolean).at(-1);
  if (!lastNonEmptyStdoutLine) {
    throw new Error(`No JSON output from ${benchEntryFileName}`);
  }

  const harnessWallSeconds = (performance.now() - harnessWallStartedAtMs) / 1000;
  console.log(
    `Finished benchmark harness: ${harnessLibraryLabel} (${harnessWallSeconds.toFixed(1)}s wall).\n`,
  );

  return JSON.parse(lastNonEmptyStdoutLine) as BenchmarkRow[];
}

function formatRelativeThroughputRatio(
  codefastThroughputHz: number,
  inversifyThroughputHz: number,
): string {
  if (!inversifyThroughputHz) {
    return "—";
  }
  const codefastVersusInversifyMultiplier = codefastThroughputHz / inversifyThroughputHz;
  return `${codefastVersusInversifyMultiplier.toFixed(2)}×`;
}

const CLI_TABLE_COLUMN_GAP = "  ";

function printCliComparisonTable(
  scenarioIdsInDisplayOrder: string[],
  inversifyRowByScenarioId: Map<string, BenchmarkRow>,
  codefastRowByScenarioId: Map<string, BenchmarkRow>,
): void {
  const inversifyThroughputHeader = `${INVERSIFY_LIBRARY_DISPLAY_NAME} hz`;
  const codefastThroughputHeader = `${CODEFAST_DI_LIBRARY_DISPLAY_NAME} hz`;
  const throughputRatioHeader = `${CODEFAST_DI_LIBRARY_DISPLAY_NAME} / ${INVERSIFY_LIBRARY_DISPLAY_NAME}`;
  const meanLatencyHeader = `Mean ms (${INVERSIFY_LIBRARY_DISPLAY_NAME} → ${CODEFAST_DI_LIBRARY_DISPLAY_NAME})`;

  const scenarioColumnWidth = Math.max(
    28,
    ...scenarioIdsInDisplayOrder.map((scenarioId) => scenarioId.length),
  );
  const inversifyThroughputColumnWidth = Math.max(14, inversifyThroughputHeader.length);
  const codefastThroughputColumnWidth = Math.max(14, codefastThroughputHeader.length);
  const throughputRatioColumnWidth = Math.max(8, throughputRatioHeader.length);

  const headerLine = [
    "Scenario".padEnd(scenarioColumnWidth),
    inversifyThroughputHeader.padStart(inversifyThroughputColumnWidth),
    codefastThroughputHeader.padStart(codefastThroughputColumnWidth),
    throughputRatioHeader.padStart(throughputRatioColumnWidth),
    meanLatencyHeader,
  ].join(CLI_TABLE_COLUMN_GAP);

  console.log(`\n${headerLine}`);
  console.log("-".repeat(headerLine.length));

  for (const scenarioId of scenarioIdsInDisplayOrder) {
    const inversifyRow = inversifyRowByScenarioId.get(scenarioId);
    const codefastRow = codefastRowByScenarioId.get(scenarioId);
    if (!inversifyRow || !codefastRow) {
      const missingLine = [
        scenarioId.padEnd(scenarioColumnWidth),
        "missing".padStart(inversifyThroughputColumnWidth),
        "missing".padStart(codefastThroughputColumnWidth),
        "—".padStart(throughputRatioColumnWidth),
        "—",
      ].join(CLI_TABLE_COLUMN_GAP);
      console.log(missingLine);
      continue;
    }

    const relativeThroughputRatioLabel = formatRelativeThroughputRatio(
      codefastRow.hz,
      inversifyRow.hz,
    );
    const meanLatencyComparisonLabel = `${inversifyRow.meanMs.toFixed(4)} → ${codefastRow.meanMs.toFixed(4)}`;
    const inversifyThroughputFormatted = Math.round(inversifyRow.hz).toLocaleString("en-US");
    const codefastThroughputFormatted = Math.round(codefastRow.hz).toLocaleString("en-US");

    const dataLine = [
      scenarioId.padEnd(scenarioColumnWidth),
      inversifyThroughputFormatted.padStart(inversifyThroughputColumnWidth),
      codefastThroughputFormatted.padStart(codefastThroughputColumnWidth),
      relativeThroughputRatioLabel.padStart(throughputRatioColumnWidth),
      meanLatencyComparisonLabel,
    ].join(CLI_TABLE_COLUMN_GAP);
    console.log(dataLine);
  }

  console.log("");
}

function main(): void {
  console.log(
    "\n@codefast/benchmark-di-inversify — comparing InversifyJS 8 with @codefast/di (same scenario identifiers, one harness per library)\n" +
      "(default: ~450ms wall + 800 iterations + short warm-up per task; tune BENCH_OPTIONS in *-benches.ts for longer runs)\n",
  );

  const inversifyBenchmarkRows = runSubBench(
    "tsconfig.inversify.json",
    "inversify-benches.ts",
    INVERSIFY_LIBRARY_DISPLAY_NAME,
  );
  const codefastBenchmarkRows = runSubBench(
    "tsconfig.codefast.json",
    "codefast-benches.ts",
    CODEFAST_DI_LIBRARY_DISPLAY_NAME,
  );

  const inversifyRowByScenarioId = new Map(inversifyBenchmarkRows.map((row) => [row.id, row]));
  const codefastRowByScenarioId = new Map(codefastBenchmarkRows.map((row) => [row.id, row]));

  const inversifyScenarioIdSet = new Set(inversifyBenchmarkRows.map((row) => row.id));
  const scenarioIdsInDisplayOrder = inversifyBenchmarkRows.map((row) => row.id);
  for (const scenarioId of codefastBenchmarkRows.map((row) => row.id)) {
    if (!inversifyScenarioIdSet.has(scenarioId)) {
      scenarioIdsInDisplayOrder.push(scenarioId);
    }
  }

  printCliComparisonTable(
    scenarioIdsInDisplayOrder,
    inversifyRowByScenarioId,
    codefastRowByScenarioId,
  );

  console.log(
    `Note: When the ratio column (${CODEFAST_DI_LIBRARY_DISPLAY_NAME} / ${INVERSIFY_LIBRARY_DISPLAY_NAME}) is greater than 1, ${CODEFAST_DI_LIBRARY_DISPLAY_NAME} is faster (higher hz). ` +
      "Throughput is tinybench throughput.mean (operations per second scaled to workload per iteration). Run several times on a quiet machine.\n",
  );
}

main();
