import { Bench } from "tinybench";
import type { TaskResult } from "tinybench";
import { isAsyncScenario } from "#/scenarios/types";
import type { AnyScenario } from "#/scenarios/types";
import type { ScenarioTrialResult, TrialPayload } from "#/harness/protocol";

/**
 * tinybench options shared across every scenario. Kept as a single block so the
 * two library subprocesses trivially stay in sync.
 *
 * - `time` / `iterations`: sample until **both** conditions are met.
 * - `warmup{Time,Iterations}`: tinybench's internal warmup, applied every `run()`.
 */
export const DEFAULT_BENCH_OPTIONS = {
  time: 450,
  iterations: 800,
  warmupTime: 60,
  warmupIterations: 60,
} as const;

/**
 * How many trials each bench subprocess runs back-to-back. The parent harness
 * aggregates these into median + IQR.
 *
 * Trial-level variance is still dominated by the *first* trial's JIT warmup.
 * We run each trial as an independent `Bench` instance so tinybench's internal
 * warmup (`warmupTime` / `warmupIterations`) fires freshly per trial — this
 * reduces (does not eliminate) the cross-trial correlation. For cleaner
 * isolation, spawn multiple subprocesses; that is the user's responsibility.
 */
export const DEFAULT_TRIAL_COUNT = 5;

/**
 * Force a full GC between tinybench tasks when `--expose-gc` is available.
 * Throughput numbers for allocation-heavy scenarios (transient / dynamic
 * chains / container-create-empty) improve markedly with this — not because
 * the bench becomes "faster" but because GC pauses no longer show up as
 * apparent variance in `latency.p99`.
 */
function runGarbageCollectionIfExposed(): void {
  if (typeof globalThis.gc === "function") {
    globalThis.gc();
  }
}

type TaskResultWithStatisticsState = Extract<
  TaskResult,
  { state: "completed" | "aborted-with-statistics" }
>;

function hasStatistics(result: TaskResult): result is TaskResultWithStatisticsState {
  return "throughput" in result && "latency" in result;
}

/**
 * Runs one trial: constructs a fresh tinybench, adds every non-filtered
 * scenario, runs it, extracts per-scenario stats.
 */
async function runOneTrial(
  trialIndex: number,
  scenarios: readonly AnyScenario[],
  sanityFailures: readonly string[],
): Promise<TrialPayload> {
  const bench = new Bench(DEFAULT_BENCH_OPTIONS);

  // Pre-build every scenario's closure before bench.add so tinybench only sees
  // pre-warmed functions. Build-time cost (container creation, binding
  // registration) should never count toward the measured workload.
  const preBuiltClosuresByScenarioId = new Map<string, () => void | Promise<void>>();
  for (const scenario of scenarios) {
    if (sanityFailures.includes(scenario.id)) {
      continue;
    }
    preBuiltClosuresByScenarioId.set(scenario.id, scenario.build());
  }

  for (const scenario of scenarios) {
    const preBuiltClosure = preBuiltClosuresByScenarioId.get(scenario.id);
    if (preBuiltClosure === undefined) {
      continue;
    }
    if (isAsyncScenario(scenario)) {
      bench.add(scenario.id, preBuiltClosure as () => Promise<void>, {
        beforeEach: runGarbageCollectionIfExposed,
      });
    } else {
      bench.add(scenario.id, preBuiltClosure as () => void, {
        beforeEach: runGarbageCollectionIfExposed,
      });
    }
  }

  await bench.run();

  const trialScenarioResults: ScenarioTrialResult[] = [];
  const scenarioById = new Map<string, AnyScenario>(
    scenarios.map((scenario) => [scenario.id, scenario]),
  );
  for (const task of bench.tasks) {
    const scenario = scenarioById.get(task.name);
    if (scenario === undefined) {
      continue;
    }
    const result = task.result;
    if (result.state === "errored") {
      const errorMessage =
        result.error instanceof Error ? result.error.message : String(result.error);
      console.error(
        `[trial ${String(trialIndex)}] scenario ${scenario.id} errored: ${errorMessage}`,
      );
      trialScenarioResults.push({
        id: scenario.id,
        group: scenario.group,
        stress: scenario.stress === true,
        batch: scenario.batch ?? 1,
        what: scenario.what,
        hzPerIteration: 0,
        hzPerOp: 0,
        meanMs: 0,
        p75Ms: 0,
        p99Ms: 0,
        p999Ms: 0,
        samples: 0,
      });
      continue;
    }
    if (!hasStatistics(result)) {
      console.error(
        `[trial ${String(trialIndex)}] scenario ${scenario.id} ended in non-statistical state "${result.state}"`,
      );
      trialScenarioResults.push({
        id: scenario.id,
        group: scenario.group,
        stress: scenario.stress === true,
        batch: scenario.batch ?? 1,
        what: scenario.what,
        hzPerIteration: 0,
        hzPerOp: 0,
        meanMs: 0,
        p75Ms: 0,
        p99Ms: 0,
        p999Ms: 0,
        samples: 0,
      });
      continue;
    }
    const batch = scenario.batch ?? 1;
    const hzPerIteration = result.throughput.mean;
    const meanSeconds = result.latency.mean;
    const p75Seconds = result.latency.p75;
    const p99Seconds = result.latency.p99;
    const p999Seconds = result.latency.p999;
    trialScenarioResults.push({
      id: scenario.id,
      group: scenario.group,
      stress: scenario.stress === true,
      batch,
      what: scenario.what,
      hzPerIteration,
      hzPerOp: hzPerIteration * batch,
      meanMs: meanSeconds * 1000,
      p75Ms: p75Seconds * 1000,
      p99Ms: p99Seconds * 1000,
      p999Ms: p999Seconds * 1000,
      samples: result.latency.samplesCount,
    });
  }

  return {
    trialIndex,
    scenarios: trialScenarioResults,
  };
}

/**
 * Runs the configured number of trials sequentially. Returns one payload per
 * trial. The parent harness aggregates across trials.
 */
export async function runAllTrials(
  scenarios: readonly AnyScenario[],
  sanityFailures: readonly string[],
  trialCount: number = resolveTrialCountFromEnvironment(),
): Promise<TrialPayload[]> {
  const trials: TrialPayload[] = [];
  for (let trialIndex = 0; trialIndex < trialCount; trialIndex++) {
    runGarbageCollectionIfExposed();
    const trial = await runOneTrial(trialIndex, scenarios, sanityFailures);
    trials.push(trial);
  }
  return trials;
}

/**
 * Honour `BENCH_TRIALS=<n>` from the environment so CI / smoke-test runs
 * can dial trials down to 1 without editing code. Falls back to
 * {@link DEFAULT_TRIAL_COUNT} when the variable is unset or unparseable.
 */
function resolveTrialCountFromEnvironment(): number {
  const rawValue = process.env["BENCH_TRIALS"];
  if (rawValue === undefined || rawValue.trim() === "") {
    return DEFAULT_TRIAL_COUNT;
  }
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    console.error(
      `[trial] BENCH_TRIALS="${rawValue}" is not a positive integer; falling back to default ${String(DEFAULT_TRIAL_COUNT)}.`,
    );
    return DEFAULT_TRIAL_COUNT;
  }
  return parsed;
}
