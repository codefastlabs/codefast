import type { BenchEvent, BenchOptions, TaskResult } from "tinybench";
import { Bench } from "tinybench";

import type { AnyBenchScenario } from "#/child/bench-scenario";
import { isAsyncScenario } from "#/child/bench-scenario";
import { BENCH_FAST_ENV_KEY, BENCH_FULL_ENV_KEY, BENCH_TRIALS_ENV_KEY } from "#/shared/env-keys";
import type { ScenarioTrialResult, TrialPayload } from "#/shared/protocol";

/**
 * Keep GC sampling in full mode, but reduce forced collection pressure so
 * long-running suites do not balloon due to GC-heavy beforeEach hooks.
 */
const FULL_MODE_SAMPLE_GC_STRIDE = 100;
const MIN_TRIAL_COUNT = 2;
const FULL_MODE_TRIAL_COUNT = 3;
const FAST_MODE_BENCH_OPTIONS = {
  time: 20,
  iterations: 50,
  warmupTime: 5,
  warmupIterations: 5,
} satisfies BenchOptions;
const FULL_MODE_BENCH_OPTIONS = {
  /**
   * Balanced full profile:
   * - keeps longer sampling than fast mode
   * - avoids very high minimum iteration counts that make slow scenarios
   *   take disproportionately long
   */
  time: 40,
  iterations: 20,
  warmupTime: 5,
  warmupIterations: 3,
} satisfies BenchOptions;

function runFullGcIfExposed(): void {
  if (typeof globalThis.gc === "function") {
    globalThis.gc();
  }
}

function createBeforeEachGcHook(fullModeEnabled: boolean): () => void {
  if (!fullModeEnabled) {
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

type TaskResultWithStatisticsState = Extract<TaskResult, { state: "completed" | "aborted-with-statistics" }>;

function hasStatistics(result: TaskResult): result is TaskResultWithStatisticsState {
  return "throughput" in result && "latency" in result;
}

function createZeroedScenarioTrialResult(scenario: AnyBenchScenario, hzPerIteration: number = 0): ScenarioTrialResult {
  const batch = scenario.batch ?? 1;
  return {
    id: scenario.id,
    group: scenario.group,
    stress: scenario.stress === true,
    batch,
    what: scenario.what,
    hzPerIteration,
    hzPerOp: hzPerIteration * batch,
    meanMs: 0,
    p75Ms: 0,
    p99Ms: 0,
    p999Ms: 0,
    samples: 0,
  };
}

/**
 * Timing profile for a bench run: `fast` for smoke checks, `full` for GC-enabled stability runs.
 */
export type BenchMode = "fast" | "full";

/**
 * @since 0.3.16-canary.0
 */
export type CreateRunAllTrialsParameters = Readonly<{
  /**
   * Tinybench settings for each `Bench` when no mode is active.
   * When a mode is active, the harness uses its built-in fast or full profile instead.
   */
  readonly benchDefaults: BenchOptions;
  /**
   * Explicit timing profile; when absent, falls back to the `BENCH_FAST`/`BENCH_FULL` env flags.
   */
  readonly mode?: BenchMode | undefined;
  /**
   * Explicit per-scenario trial count (minimum 2); when absent, falls back to `BENCH_TRIALS`,
   * then to the mode default.
   */
  readonly trialCount?: number | undefined;
}>;

/**
 * @since 0.3.16-canary.0
 */
export type RunAllTrials = (
  scenarios: ReadonlyArray<AnyBenchScenario>,
  sanityFailures: ReadonlyArray<string>,
  trialCount?: number,
) => Promise<Array<TrialPayload>>;

// `fast` wins when both env flags are set — matches the historical option precedence.
function resolveMode(explicitMode: BenchMode | undefined): BenchMode | undefined {
  if (explicitMode !== undefined) {
    return explicitMode;
  }
  if (process.env[BENCH_FAST_ENV_KEY] === "1") {
    return "fast";
  }
  if (process.env[BENCH_FULL_ENV_KEY] === "1") {
    return "full";
  }
  return undefined;
}

function resolveBenchOptions(benchDefaults: BenchOptions, mode: BenchMode | undefined): BenchOptions {
  if (mode === "fast") {
    return FAST_MODE_BENCH_OPTIONS;
  }
  if (mode === "full") {
    return FULL_MODE_BENCH_OPTIONS;
  }
  return benchDefaults;
}

function resolveTrialCount(explicitTrialCount: number | undefined, mode: BenchMode | undefined): number {
  const defaultTrialCount = mode === "full" ? FULL_MODE_TRIAL_COUNT : MIN_TRIAL_COUNT;
  const rawValue = explicitTrialCount ?? process.env[BENCH_TRIALS_ENV_KEY];
  if (rawValue === undefined || (typeof rawValue === "string" && rawValue.trim() === "")) {
    return defaultTrialCount;
  }
  const parsed = typeof rawValue === "number" ? Math.trunc(rawValue) : Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < MIN_TRIAL_COUNT) {
    console.error(
      `[trial] trial count "${String(rawValue)}" is below minimum ${String(MIN_TRIAL_COUNT)}; falling back to default ${String(defaultTrialCount)}.`,
    );
    return defaultTrialCount;
  }
  return parsed;
}

/**
 * Returns `runAllTrials` backed by tinybench options derived from `benchDefaults` and
 * the given mode/trial-count options, falling back to the subprocess env
 * (`BENCH_FAST`, `BENCH_FULL`, `BENCH_TRIALS`) when they are absent.
 *
 * @since 0.3.16-canary.0
 */
export function createRunAllTrials(parameters: CreateRunAllTrialsParameters): {
  runAllTrials: RunAllTrials;
} {
  const { benchDefaults } = parameters;
  const mode = resolveMode(parameters.mode);
  const benchOptions = resolveBenchOptions(benchDefaults, mode);
  const defaultTrialCount = resolveTrialCount(parameters.trialCount, mode);

  async function runOneTrial(
    trialIndex: number,
    trialCount: number,
    scenarios: ReadonlyArray<AnyBenchScenario>,
    sanityFailures: ReadonlyArray<string>,
  ): Promise<TrialPayload> {
    const beforeEachGc = createBeforeEachGcHook(mode === "full");
    const bench = new Bench(benchOptions);
    const sanityFailureSet = new Set(sanityFailures);
    const runnableScenarioCount = scenarios.filter((scenario) => !sanityFailureSet.has(scenario.id)).length;
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
    const scenarioById = new Map<string, AnyBenchScenario>(scenarios.map((scenario) => [scenario.id, scenario]));
    for (const task of bench.tasks) {
      const scenario = scenarioById.get(task.name);
      if (scenario === undefined) {
        continue;
      }
      const result = task.result;
      if (result.state === "errored") {
        const errorMessage = result.error instanceof Error ? result.error.message : String(result.error);
        console.error(`[trial ${String(trialIndex)}] scenario ${scenario.id} errored: ${errorMessage}`);
        trialScenarioResults.push(createZeroedScenarioTrialResult(scenario));
        continue;
      }
      if (!hasStatistics(result)) {
        console.error(
          `[trial ${String(trialIndex)}] scenario ${scenario.id} ended in non-statistical state "${result.state}"`,
        );
        trialScenarioResults.push(createZeroedScenarioTrialResult(scenario));
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
    trialCount: number = defaultTrialCount,
  ): Promise<Array<TrialPayload>> {
    const trials: Array<TrialPayload> = [];
    const scenarioStartedAtMs = performance.now();
    for (let trialIndex = 0; trialIndex < trialCount; trialIndex++) {
      runFullGcIfExposed();
      const trial = await runOneTrial(trialIndex, trialCount, scenarios, sanityFailures);
      trials.push(trial);
      console.error(`[bench] trial ${String(trialIndex + 1)}/${String(trialCount)} all scenarios finished`);
      if (trialIndex === trialCount - 1) {
        const scenarioElapsedMs = performance.now() - scenarioStartedAtMs;
        console.error(`[bench] all scenarios wall time: ${scenarioElapsedMs.toFixed(0)}ms`);
      }
    }
    return trials;
  }

  return { runAllTrials };
}
