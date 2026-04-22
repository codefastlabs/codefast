#!/usr/bin/env node
/**
 * Runs Inversify v8 and @codefast/di benches (separate TS configs) and prints a comparison table.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type BenchmarkRow = {
  id: string;
  hz: number;
  meanMs: number;
};

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");

function runSubBench(tsconfigFileName: string, benchEntryFileName: string): BenchmarkRow[] {
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

function main(): void {
  const inversifyBenchmarkRows = runSubBench("tsconfig.inversify.json", "inversify-benches.ts");
  const codefastBenchmarkRows = runSubBench("tsconfig.codefast.json", "codefast-benches.ts");

  const inversifyRowByScenarioId = new Map(inversifyBenchmarkRows.map((row) => [row.id, row]));
  const codefastRowByScenarioId = new Map(codefastBenchmarkRows.map((row) => [row.id, row]));

  const inversifyScenarioIdSet = new Set(inversifyBenchmarkRows.map((row) => row.id));
  const scenarioIdsInDisplayOrder = inversifyBenchmarkRows.map((row) => row.id);
  for (const scenarioId of codefastBenchmarkRows.map((row) => row.id)) {
    if (!inversifyScenarioIdSet.has(scenarioId)) {
      scenarioIdsInDisplayOrder.push(scenarioId);
    }
  }

  console.log(
    "\n@codefast/benchmark-di-inversify — same scenario IDs, separate harnesses per library\n" +
      "(default: ~450ms wall + 800 iterations + short warm-up per task; tune BENCH_OPTIONS in *-benches.ts for longer runs)\n",
  );
  console.log(
    "| Scenario | Inversify v8 hz | @codefast/di hz | di / inv | mean ms (inv → di) |\n|---|---:|---:|---:|---|",
  );

  for (const scenarioId of scenarioIdsInDisplayOrder) {
    const inversifyRow = inversifyRowByScenarioId.get(scenarioId);
    const codefastRow = codefastRowByScenarioId.get(scenarioId);
    if (!inversifyRow || !codefastRow) {
      console.log(`| ${scenarioId} | missing | missing | — | — |`);
      continue;
    }
    const relativeThroughputRatioLabel = formatRelativeThroughputRatio(
      codefastRow.hz,
      inversifyRow.hz,
    );
    const meanLatencyComparisonLabel = `${inversifyRow.meanMs.toFixed(4)} → ${codefastRow.meanMs.toFixed(4)}`;
    const inversifyThroughputFormatted = Math.round(inversifyRow.hz).toLocaleString("en-US");
    const codefastThroughputFormatted = Math.round(codefastRow.hz).toLocaleString("en-US");
    console.log(
      `| ${scenarioId} | ${inversifyThroughputFormatted} | ${codefastThroughputFormatted} | ${relativeThroughputRatioLabel} | ${meanLatencyComparisonLabel} |`,
    );
  }

  console.log(
    "\nNote: `di / inv` > 1 means @codefast/di is faster (higher hz). Throughput is tinybench `throughput.mean` (ops/s scaled to workload per iteration). Run several times on a quiet machine.\n",
  );
}

main();
