import { Bench, type BenchEvent } from "tinybench";
import type { TaskResult } from "tinybench";
import { isAsyncScenario } from "#/scenarios/types";
import type { AnyScenario } from "#/scenarios/types";
import type { ScenarioTrialResult, TrialPayload } from "@codefast/benchmark-harness/protocol";

/**
 * tinybench options shared across every library subprocess.
 *
 * Default (neither FAST nor FULL) matches the historical tailwind-variants benchmark profile.
 */
const FAST_MODE_ENABLED = process.env["BENCH_FAST"] === "1";
const FULL_MODE_ENABLED = process.env["BENCH_FULL"] === "1";

const FULL_MODE_SAMPLE_GC_STRIDE = 25;

const DEFAULT_BENCH_OPTIONS = FAST_MODE_ENABLED
  ? {
      time: 20,
      iterations: 50,
      warmupTime: 5,
      warmupIterations: 5,
    }
  : FULL_MODE_ENABLED
    ? {
        time: 100,
        iterations: 100,
        warmupTime: 10,
        warmupIterations: 10,
      }
    : {
        time: 1000,
        iterations: 1000,
        warmupTime: 100,
        warmupIterations: 100,
      };

const MIN_TRIAL_COUNT = 2;
const DEFAULT_TRIAL_COUNT = FULL_MODE_ENABLED ? 3 : MIN_TRIAL_COUNT;

function runFullGcIfExposed(): void {
  if (typeof globalThis.gc === "function") {
    globalThis.gc();
  }
}

function createBeforeEachGcHook(): () => void {
  let callIndex = 0;
  return (): void => {
    if (typeof globalThis.gc !== "function") {
      return;
    }
    if (FULL_MODE_ENABLED) {
      if (callIndex++ % FULL_MODE_SAMPLE_GC_STRIDE !== 0) {
        return;
      }
    } else if (FAST_MODE_ENABLED) {
      console.debug("[GC] Manual GC triggered");
    }
    globalThis.gc();
  };
}

type TaskResultWithStatisticsState = Extract<
  TaskResult,
  { state: "completed" | "aborted-with-statistics" }
>;

function hasStatistics(result: TaskResult): result is TaskResultWithStatisticsState {
  return "throughput" in result && "latency" in result;
}

async function runOneTrial(
  trialIndex: number,
  trialCount: number,
  scenarios: readonly AnyScenario[],
  sanityFailures: readonly string[],
): Promise<TrialPayload> {
  const beforeEachGc = createBeforeEachGcHook();
  const bench = new Bench(DEFAULT_BENCH_OPTIONS);
  const runnableScenarioCount = scenarios.filter(
    (scenario) => !sanityFailures.includes(scenario.id),
  ).length;
  let completedScenarioCount = 0;

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
        beforeEach: beforeEachGc,
      });
    } else {
      bench.add(scenario.id, preBuiltClosure as () => void, {
        beforeEach: beforeEachGc,
      });
    }
  }

  bench.addEventListener("cycle", (event: Event) => {
    const benchEvent = event as BenchEvent<"cycle">;
    const task = benchEvent.task;
    if (task === undefined) {
      return;
    }
    completedScenarioCount += 1;
    console.error(
      `[bench] trial ${String(trialIndex + 1)}/${String(trialCount)} scenario ${String(completedScenarioCount)}/${String(runnableScenarioCount)} done: ${task.name}`,
    );
  });

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

export async function runAllTrials(
  scenarios: readonly AnyScenario[],
  sanityFailures: readonly string[],
  trialCount: number = resolveTrialCountFromEnvironment(),
): Promise<TrialPayload[]> {
  const trials: TrialPayload[] = [];
  const scenarioStartedAtMs = performance.now();
  for (let trialIndex = 0; trialIndex < trialCount; trialIndex++) {
    runFullGcIfExposed();
    const trial = await runOneTrial(trialIndex, trialCount, scenarios, sanityFailures);
    trials.push(trial);
    console.error(
      `[bench] trial ${String(trialIndex + 1)}/${String(trialCount)} all scenarios finished`,
    );
    if (trialIndex === trialCount - 1) {
      const scenarioElapsedMs = performance.now() - scenarioStartedAtMs;
      console.error(`[bench] all scenarios wall time: ${scenarioElapsedMs.toFixed(0)}ms`);
    }
  }
  return trials;
}

function resolveTrialCountFromEnvironment(): number {
  const rawValue = process.env["BENCH_TRIALS"];
  if (rawValue === undefined || rawValue.trim() === "") {
    return DEFAULT_TRIAL_COUNT;
  }
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < MIN_TRIAL_COUNT) {
    console.error(
      `[trial] BENCH_TRIALS="${rawValue}" is below minimum ${String(MIN_TRIAL_COUNT)}; falling back to default ${String(DEFAULT_TRIAL_COUNT)}.`,
    );
    return DEFAULT_TRIAL_COUNT;
  }
  return parsed;
}
