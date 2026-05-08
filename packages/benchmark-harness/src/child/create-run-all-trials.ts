import { Bench } from "tinybench";
import type { BenchEvent } from "tinybench";
import type { BenchOptions, TaskResult } from "tinybench";
import { isAsyncScenario } from "#/child/bench-scenario";
import type { AnyBenchScenario } from "#/child/bench-scenario";
import { BENCH_FAST_ENV_KEY, BENCH_FULL_ENV_KEY } from "#/shared/env-keys";
import type { ScenarioTrialResult, TrialPayload } from "#/shared/protocol";

const FAST_MODE_ENABLED = process.env[BENCH_FAST_ENV_KEY] === "1";
const FULL_MODE_ENABLED = process.env[BENCH_FULL_ENV_KEY] === "1";

const FULL_MODE_SAMPLE_GC_STRIDE = 25;

const MIN_TRIAL_COUNT = 2;
const DEFAULT_TRIAL_COUNT = FULL_MODE_ENABLED ? 3 : MIN_TRIAL_COUNT;

function runFullGcIfExposed(): void {
  if (typeof globalThis.gc === "function") {
    globalThis.gc();
  }
}

function createBeforeEachGcHook(): () => void {
  if (!FULL_MODE_ENABLED) {
    return (): void => {};
  }
  let callIndex = 0;
  return (): void => {
    if (typeof globalThis.gc !== "function") {
      return;
    }
    if (callIndex++ % FULL_MODE_SAMPLE_GC_STRIDE !== 0) {
      return;
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

/**
 * @since 0.3.16-canary.0
 */
export type CreateRunAllTrialsParameters = Readonly<{
  /**
   * Tinybench settings for each `Bench` when neither `BENCH_FAST` nor `BENCH_FULL` is set.
   * When either flag is set, the harness uses its built-in fast or full profile instead.
   */
  readonly benchDefaults: BenchOptions;
}>;

/**
 * @since 0.3.16-canary.0
 */
export type RunAllTrials = (
  scenarios: ReadonlyArray<AnyBenchScenario>,
  sanityFailures: ReadonlyArray<string>,
  trialCount?: number,
) => Promise<Array<TrialPayload>>;

function resolveBenchOptions(benchDefaults: BenchOptions): BenchOptions {
  return FAST_MODE_ENABLED
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
      : benchDefaults;
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

/**
 * Returns `runAllTrials` backed by tinybench options derived from `benchDefaults` and
 * the subprocess env (`BENCH_FAST`, `BENCH_FULL`).
 *
 * @since 0.3.16-canary.0
 */
export function createRunAllTrials(parameters: CreateRunAllTrialsParameters): {
  runAllTrials: RunAllTrials;
} {
  const { benchDefaults } = parameters;
  const benchOptions = resolveBenchOptions(benchDefaults);

  async function runOneTrial(
    trialIndex: number,
    trialCount: number,
    scenarios: ReadonlyArray<AnyBenchScenario>,
    sanityFailures: ReadonlyArray<string>,
  ): Promise<TrialPayload> {
    const beforeEachGc = createBeforeEachGcHook();
    const bench = new Bench(benchOptions);
    const sanityFailureSet = new Set(sanityFailures);
    const runnableScenarioCount = scenarios.filter(
      (scenario) => !sanityFailureSet.has(scenario.id),
    ).length;
    let completedScenarioCount = 0;

    const preBuiltClosuresByScenarioId = new Map<string, () => void | Promise<void>>();
    for (const scenario of scenarios) {
      if (sanityFailureSet.has(scenario.id)) {
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

    const trialScenarioResults: Array<ScenarioTrialResult> = [];
    const scenarioById = new Map<string, AnyBenchScenario>(
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
      trialScenarioResults.push({
        id: scenario.id,
        group: scenario.group,
        stress: scenario.stress === true,
        batch,
        what: scenario.what,
        hzPerIteration,
        hzPerOp: hzPerIteration * batch,
        meanMs: result.latency.mean,
        p75Ms: result.latency.p75,
        p99Ms: result.latency.p99,
        p999Ms: result.latency.p999,
        samples: result.latency.samplesCount,
      });
    }

    return {
      trialIndex,
      scenarios: trialScenarioResults,
    };
  }

  async function runAllTrials(
    scenarios: ReadonlyArray<AnyBenchScenario>,
    sanityFailures: ReadonlyArray<string>,
    trialCount: number = resolveTrialCountFromEnvironment(),
  ): Promise<Array<TrialPayload>> {
    const trials: Array<TrialPayload> = [];
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

  return { runAllTrials };
}
