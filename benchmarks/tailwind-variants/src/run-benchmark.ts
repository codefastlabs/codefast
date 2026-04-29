#!/usr/bin/env node
/**
 * Builds @codefast/tailwind-variants, runs all tinybench scenarios, prints one ASCII comparison table
 * (same spirit as benchmarks/di-inversify).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatLatencyMeanMilliseconds,
  formatThroughputOpsPerSecond,
  formatThroughputRatio,
} from "@codefast/benchmark-harness/presentation/format";
import { Bench, Task, type TaskResult } from "tinybench";
import { BENCH_OPTIONS } from "#/bench-options";
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

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");

const CODEFAST_TAILWIND_VARIANTS_FILTER = "@codefast/tailwind-variants";
const CODEFAST_TAILWIND_VARIANTS_DISPLAY = "@codefast/tailwind-variants";
/** Short label for report table headers (package is @codefast/tailwind-variants). */
const REPORT_CODEFAST_LABEL = "@codefast/tv";
/** Short label for upstream `tv` column (tailwind-variants npm package). */
const REPORT_UPSTREAM_TV_LABEL = "tv";
const UPSTREAM_TV_DISPLAY = "tailwind-variants";

const TASK_UPSTREAM = "tailwind-variants";
const TASK_CVA = "class-variance-authority";
const TASK_CODEFAST = "@codefast/tailwind-variants";

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

function shortTaskLabel(taskName: string): string {
  if (taskName === TASK_UPSTREAM) {
    return "tv";
  }
  if (taskName === TASK_CODEFAST) {
    return "@codefast/tv";
  }
  if (taskName === TASK_CVA) {
    return "CVA";
  }
  return taskName;
}

function logSingleLibraryTaskWallLine(task: Task): void {
  const result = task.result;
  if (!isStatisticalResult(result)) {
    const state = "state" in result ? result.state : "unknown";
    console.log(`  ${shortTaskLabel(task.name)}: — (${state})`);
    return;
  }
  const seconds = (result.totalTime / 1000).toFixed(2);
  console.log(`  ${shortTaskLabel(task.name)}: ${seconds}s wall`);
}

function formatMeanTriplet(
  codefast: TaskMetrics,
  upstream: TaskMetrics,
  cva: TaskMetrics | null,
): string {
  const a = formatLatencyMeanMilliseconds(codefast.meanMs);
  const b = formatLatencyMeanMilliseconds(upstream.meanMs);
  if (!cva) {
    return `${a} → ${b}`;
  }
  const c = formatLatencyMeanMilliseconds(cva.meanMs);
  return `${a} → ${b} → ${c}`;
}

const CLI_TABLE_COLUMN_GAP = "  ";

function printWhyHarnessWallTimesDiffer(): void {
  console.log(
    [
      "Why “Finished … (Xs wall)” per scenario can differ from the hz columns:",
      "",
      `Each tinybench task keeps sampling until BOTH are true: at least \`iterations\` samples (${String(BENCH_OPTIONS.iterations)})`,
      `AND the sum of per-sample durations is at least \`time\` (${String(BENCH_OPTIONS.time)} ms). When one callback is very`,
      "fast, the iteration budget may not add up to the time budget yet, so tinybench runs extra iterations. When a",
      "callback is slower, the time budget is reached sooner. Scenario wall time is therefore not a fair head-to-head",
      "score between libraries; use the table (throughput hz and mean ms) instead.",
      "",
      "Indented lines under each scenario (tv / @codefast/tv / CVA) print as each task finishes measuring, via",
      "tinybench’s bench `cycle` event. They use per-task totalTime (ms for that task’s benchmark cycle), shown as",
      "seconds. They may sum to less than the scenario clock wall because the scenario timer includes warmup and",
      "bench scheduling between tasks.",
      "",
    ].join("\n"),
  );
}

function printComparisonTable(rows: ScenarioRow[]): void {
  const headerScenario = "Scenario";
  const headerCodefast = `${REPORT_CODEFAST_LABEL} hz`;
  const headerUpstream = `${REPORT_UPSTREAM_TV_LABEL} hz`;
  const headerCva = "CVA hz";
  const headerRatioTv = `${REPORT_CODEFAST_LABEL} / ${REPORT_UPSTREAM_TV_LABEL}`;
  const headerRatioCva = `${REPORT_CODEFAST_LABEL} / CVA`;
  const headerMean = `Mean ms (${REPORT_CODEFAST_LABEL} → ${REPORT_UPSTREAM_TV_LABEL} [→ CVA])`;

  const cells = rows.map((row) => ({
    scenario: row.scenarioId,
    codefast: formatThroughputOpsPerSecond(row.codefast.hz),
    upstream: formatThroughputOpsPerSecond(row.upstream.hz),
    cva: row.cva !== null ? formatThroughputOpsPerSecond(row.cva.hz) : "—",
    ratioTv: formatThroughputRatio(row.codefast.hz, row.upstream.hz),
    ratioCva: row.cva !== null ? formatThroughputRatio(row.codefast.hz, row.cva.hz) : "—",
    mean: formatMeanTriplet(row.codefast, row.upstream, row.cva),
  }));

  const wScenario = Math.max(
    28,
    headerScenario.length,
    ...cells.map((cell) => cell.scenario.length),
  );
  const wCodefast = Math.max(headerCodefast.length, ...cells.map((cell) => cell.codefast.length));
  const wUpstream = Math.max(headerUpstream.length, ...cells.map((cell) => cell.upstream.length));
  const wCva = Math.max(headerCva.length, ...cells.map((cell) => cell.cva.length));
  const wRatioTv = Math.max(headerRatioTv.length, ...cells.map((cell) => cell.ratioTv.length));
  const wRatioCva = Math.max(headerRatioCva.length, ...cells.map((cell) => cell.ratioCva.length));
  const wMean = Math.max(headerMean.length, ...cells.map((cell) => cell.mean.length));

  const headerLine = [
    headerScenario.padEnd(wScenario),
    headerCodefast.padStart(wCodefast),
    headerUpstream.padStart(wUpstream),
    headerCva.padStart(wCva),
    headerRatioTv.padStart(wRatioTv),
    headerRatioCva.padStart(wRatioCva),
    headerMean.padEnd(wMean),
  ].join(CLI_TABLE_COLUMN_GAP);

  console.log(`\n${headerLine}`);
  console.log("-".repeat(headerLine.length));

  for (const cell of cells) {
    const dataLine = [
      cell.scenario.padEnd(wScenario),
      cell.codefast.padStart(wCodefast),
      cell.upstream.padStart(wUpstream),
      cell.cva.padStart(wCva),
      cell.ratioTv.padStart(wRatioTv),
      cell.ratioCva.padStart(wRatioCva),
      cell.mean.padEnd(wMean),
    ].join(CLI_TABLE_COLUMN_GAP);
    console.log(dataLine);
  }

  console.log("");
}

async function runScenario(scenarioId: string, bench: Bench): Promise<ScenarioRow> {
  console.log(`Running scenario: ${scenarioId}…`);
  const startedAtMs = performance.now();
  const onBenchCycle = (event: Event): void => {
    const task = (event as { task?: Task }).task;
    if (task === undefined) {
      return;
    }
    logSingleLibraryTaskWallLine(task);
  };
  bench.addEventListener("cycle", onBenchCycle);
  try {
    await bench.run();
  } finally {
    bench.removeEventListener("cycle", onBenchCycle);
  }
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
      `(per task: warm-up ${String(BENCH_OPTIONS.warmupIterations)} iterations / ${String(BENCH_OPTIONS.warmupTime)} ms, ` +
      `then measure until at least ${String(BENCH_OPTIONS.iterations)} iterations AND at least ${String(BENCH_OPTIONS.time)} ms summed sample time)\n` +
      "Scenarios that include CVA run tasks in order: tv (tailwind-variants) → @codefast/tv → class-variance-authority.\n",
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
    `Note: When ${REPORT_CODEFAST_LABEL} / ${REPORT_UPSTREAM_TV_LABEL} (or / CVA) is greater than 1, ` +
      `${REPORT_CODEFAST_LABEL} (${CODEFAST_TAILWIND_VARIANTS_DISPLAY}) is faster than ${REPORT_UPSTREAM_TV_LABEL} (${UPSTREAM_TV_DISPLAY}) (higher hz). ` +
      "Throughput is tinybench throughput.mean (operations per second scaled to workload per iteration). " +
      "“—” in CVA columns means that scenario has no class-variance-authority (CVA) task. Run several times on a quiet machine.\n",
  );
}

void main().catch((error: unknown) => {
  console.error("Benchmark failed:", error);
  process.exit(1);
});
