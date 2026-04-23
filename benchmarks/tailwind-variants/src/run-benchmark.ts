#!/usr/bin/env node
/**
 * Builds @codefast/tailwind-variants, runs all tinybench scenarios, prints one ASCII comparison table
 * (same spirit as benchmarks/di-inversify).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createComplexWithMergeBenchmark,
  createComplexWithoutMergeBenchmark,
  createCompoundSlotsWithMergeBenchmark,
  createCompoundSlotsWithoutMergeBenchmark,
  createCreateTVWithMergeBenchmark,
  createCreateTVWithoutMergeBenchmark,
  createExtendsWithMergeBenchmark,
  createExtendsWithoutMergeBenchmark,
  createExtremeSlotsWithMergeBenchmark,
  createExtremeSlotsWithoutMergeBenchmark,
  createExtremeWithMergeBenchmark,
  createExtremeWithoutMergeBenchmark,
  createSimpleWithMergeBenchmark,
  createSimpleWithoutMergeBenchmark,
  createSlotsWithMergeBenchmark,
  createSlotsWithoutMergeBenchmark,
} from "#/benchmarks/index";
import { Bench, type TaskResult } from "tinybench";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");

const CODEFAST_TAILWIND_VARIANTS_FILTER = "@codefast/tailwind-variants";
const CODEFAST_TAILWIND_VARIANTS_DISPLAY = "@codefast/tailwind-variants";
/** Short label for report table headers (package is @codefast/tailwind-variants). */
const REPORT_CODEFAST_LABEL = "@codefast/tv";
const UPSTREAM_TV_DISPLAY = "tailwind-variants";

const TASK_UPSTREAM = "tailwind-variants";
const TASK_CVA = "class-variance-authority";
const TASK_CODEFAST = "@codefast/tailwind-variants";

const BENCH_ITERATIONS = 1000;
const BENCH_TIME_MS = 1000;
const BENCH_WARMUP_ITERATIONS = 100;
const BENCH_WARMUP_MS = 100;

type TaskMetrics = {
  hz: number;
  meanMs: number;
};

type ScenarioRow = {
  scenarioId: string;
  codefast: TaskMetrics;
  upstream: TaskMetrics;
  cva: TaskMetrics | null;
};

function isStatisticalResult(
  result: TaskResult,
): result is Extract<TaskResult, { state: "aborted-with-statistics" } | { state: "completed" }> {
  return result.state === "completed" || result.state === "aborted-with-statistics";
}

function collectTaskMetrics(bench: Bench): Map<string, TaskMetrics> {
  const byName = new Map<string, TaskMetrics>();
  for (const task of bench.tasks) {
    const result = task.result;
    if (!isStatisticalResult(result)) {
      continue;
    }
    byName.set(task.name, {
      hz: result.throughput.mean ?? 0,
      meanMs: result.latency.mean * 1000,
    });
  }
  return byName;
}

function requireMetrics(
  scenarioId: string,
  byName: Map<string, TaskMetrics>,
  taskName: string,
): TaskMetrics {
  const found = byName.get(taskName);
  if (!found) {
    throw new Error(`Scenario "${scenarioId}" missing task "${taskName}"`);
  }
  return found;
}

function buildCodefastTailwindVariantsPackage(): void {
  console.log(`Building ${CODEFAST_TAILWIND_VARIANTS_DISPLAY} before benchmark…`);
  const buildStartedAtMs = performance.now();
  const buildResult = spawnSync("pnpm", ["--filter", CODEFAST_TAILWIND_VARIANTS_FILTER, "build"], {
    cwd: packageRootDirectory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  if (buildResult.status !== 0) {
    console.error(buildResult.stderr || buildResult.stdout);
    throw new Error(
      `Build failed for ${CODEFAST_TAILWIND_VARIANTS_DISPLAY}, exit ${String(buildResult.status)}`,
    );
  }
  const buildWallSeconds = (performance.now() - buildStartedAtMs) / 1000;
  console.log(
    `Finished building ${CODEFAST_TAILWIND_VARIANTS_DISPLAY} (${buildWallSeconds.toFixed(1)}s wall).\n`,
  );
}

function formatRatio(numeratorHz: number, denominatorHz: number): string {
  if (!denominatorHz) {
    return "—";
  }
  return `${(numeratorHz / denominatorHz).toFixed(2)}×`;
}

function formatHz(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function formatMeanTriplet(
  codefast: TaskMetrics,
  upstream: TaskMetrics,
  cva: TaskMetrics | null,
): string {
  const a = codefast.meanMs.toFixed(4);
  const b = upstream.meanMs.toFixed(4);
  if (!cva) {
    return `${a} → ${b}`;
  }
  const c = cva.meanMs.toFixed(4);
  return `${a} → ${b} → ${c}`;
}

const CLI_TABLE_COLUMN_GAP = "  ";

function printWhyHarnessWallTimesDiffer(): void {
  console.log(
    [
      "Why “Finished … (Xs wall)” per scenario can differ from the hz columns:",
      "",
      `Each tinybench task keeps sampling until BOTH are true: at least \`iterations\` samples (${String(BENCH_ITERATIONS)})`,
      `AND the sum of per-sample durations is at least \`time\` (${String(BENCH_TIME_MS)} ms). When one callback is very`,
      "fast, the iteration budget may not add up to the time budget yet, so tinybench runs extra iterations. When a",
      "callback is slower, the time budget is reached sooner. Scenario wall time is therefore not a fair head-to-head",
      "score between libraries; use the table (throughput hz and mean ms) instead.",
      "",
    ].join("\n"),
  );
}

function printComparisonTable(rows: ScenarioRow[]): void {
  const hCodefast = `${REPORT_CODEFAST_LABEL} hz`;
  const hUpstream = `${UPSTREAM_TV_DISPLAY} hz`;
  const hCva = "CVA hz";
  const hRatioTv = `${REPORT_CODEFAST_LABEL} / ${UPSTREAM_TV_DISPLAY}`;
  const hRatioCva = `${REPORT_CODEFAST_LABEL} / CVA`;
  const hMean = `Mean ms (${REPORT_CODEFAST_LABEL} → ${UPSTREAM_TV_DISPLAY} [→ CVA])`;

  const scenarioColumnWidth = Math.max(28, ...rows.map((row) => row.scenarioId.length));
  const wCodefast = Math.max(12, hCodefast.length);
  const wUpstream = Math.max(12, hUpstream.length);
  const wCva = Math.max(6, hCva.length);
  const wRatioTv = Math.max(8, hRatioTv.length);
  const wRatioCva = Math.max(8, hRatioCva.length);

  const headerLine = [
    "Scenario".padEnd(scenarioColumnWidth),
    hCodefast.padStart(wCodefast),
    hUpstream.padStart(wUpstream),
    hCva.padStart(wCva),
    hRatioTv.padStart(wRatioTv),
    hRatioCva.padStart(wRatioCva),
    hMean,
  ].join(CLI_TABLE_COLUMN_GAP);

  console.log(`\n${headerLine}`);
  console.log("-".repeat(headerLine.length));

  for (const row of rows) {
    const ratioTv = formatRatio(row.codefast.hz, row.upstream.hz);
    const ratioCvaCell = (
      row.cva !== null ? formatRatio(row.codefast.hz, row.cva.hz) : "—"
    ).padStart(wRatioCva);
    const cvaCell = (row.cva !== null ? formatHz(row.cva.hz) : "—").padStart(wCva);

    const dataLine = [
      row.scenarioId.padEnd(scenarioColumnWidth),
      formatHz(row.codefast.hz).padStart(wCodefast),
      formatHz(row.upstream.hz).padStart(wUpstream),
      cvaCell,
      ratioTv.padStart(wRatioTv),
      ratioCvaCell,
      formatMeanTriplet(row.codefast, row.upstream, row.cva),
    ].join(CLI_TABLE_COLUMN_GAP);
    console.log(dataLine);
  }

  console.log("");
}

async function runScenario(scenarioId: string, bench: Bench): Promise<ScenarioRow> {
  console.log(`Running scenario: ${scenarioId}…`);
  const startedAtMs = performance.now();
  await bench.run();
  const wallSeconds = (performance.now() - startedAtMs) / 1000;
  console.log(`Finished scenario: ${scenarioId} (${wallSeconds.toFixed(1)}s wall).\n`);

  const byName = collectTaskMetrics(bench);
  const codefast = requireMetrics(scenarioId, byName, TASK_CODEFAST);
  const upstream = requireMetrics(scenarioId, byName, TASK_UPSTREAM);
  const cva = byName.get(TASK_CVA) ?? null;

  return { scenarioId, codefast, upstream, cva };
}

async function main(): Promise<void> {
  console.log(
    "\n@codefast/benchmark-tailwind-variants — comparing libraries with " +
      `${CODEFAST_TAILWIND_VARIANTS_DISPLAY} as the primary baseline\n` +
      `(per task: warm-up ${String(BENCH_WARMUP_ITERATIONS)} iterations / ${String(BENCH_WARMUP_MS)} ms, ` +
      `then measure until at least ${String(BENCH_ITERATIONS)} iterations AND at least ${String(BENCH_TIME_MS)} ms summed sample time)\n`,
  );

  buildCodefastTailwindVariantsPackage();

  const rows: ScenarioRow[] = [];

  rows.push(await runScenario("simple-without-merge", createSimpleWithoutMergeBenchmark()));
  rows.push(await runScenario("simple-with-merge", createSimpleWithMergeBenchmark()));
  rows.push(await runScenario("complex-without-merge", createComplexWithoutMergeBenchmark()));
  rows.push(await runScenario("complex-with-merge", createComplexWithMergeBenchmark()));
  rows.push(await runScenario("slots-without-merge", createSlotsWithoutMergeBenchmark()));
  rows.push(await runScenario("slots-with-merge", createSlotsWithMergeBenchmark()));
  rows.push(
    await runScenario("compound-slots-without-merge", createCompoundSlotsWithoutMergeBenchmark()),
  );
  rows.push(
    await runScenario("compound-slots-with-merge", createCompoundSlotsWithMergeBenchmark()),
  );
  rows.push(await runScenario("extends-without-merge", createExtendsWithoutMergeBenchmark()));
  rows.push(await runScenario("extends-with-merge", createExtendsWithMergeBenchmark()));
  rows.push(await runScenario("create-tv-without-merge", createCreateTVWithoutMergeBenchmark()));
  rows.push(await runScenario("create-tv-with-merge", createCreateTVWithMergeBenchmark()));
  rows.push(await runScenario("extreme-without-merge", createExtremeWithoutMergeBenchmark()));
  rows.push(await runScenario("extreme-with-merge", createExtremeWithMergeBenchmark()));
  rows.push(
    await runScenario("extreme-slots-without-merge", createExtremeSlotsWithoutMergeBenchmark()),
  );
  rows.push(await runScenario("extreme-slots-with-merge", createExtremeSlotsWithMergeBenchmark()));

  printWhyHarnessWallTimesDiffer();
  printComparisonTable(rows);

  console.log(
    `Note: When ${REPORT_CODEFAST_LABEL} / ${UPSTREAM_TV_DISPLAY} (or / CVA) is greater than 1, ` +
      `${REPORT_CODEFAST_LABEL} (${CODEFAST_TAILWIND_VARIANTS_DISPLAY}) is faster (higher hz). ` +
      "Throughput is tinybench throughput.mean (operations per second scaled to workload per iteration). " +
      "“—” in CVA columns means that scenario has no class-variance-authority (CVA) task. Run several times on a quiet machine.\n",
  );
}

void main().catch((error: unknown) => {
  console.error("Benchmark failed:", error);
  process.exit(1);
});
