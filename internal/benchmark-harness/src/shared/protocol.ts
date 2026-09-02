/**
 * Wire protocol between per-library bench subprocesses and the parent runner.
 *
 * @since 0.3.16-canary.0
 */

/**
 * Marker line opening the framed JSON payload on child stdout — the parent reads only
 * framed content, so warnings, banners, and stray logs never contaminate parsing.
 */
export const BENCH_RESULT_JSON_START = "BENCH_RESULT_JSON_START";
/**
 * Marker line closing the framed JSON payload on child stdout.
 *
 * @since 0.3.16-canary.0
 */
export const BENCH_RESULT_JSON_END = "BENCH_RESULT_JSON_END";

/**
 * A single tinybench task result after aggregation across trials. All durations
 * are reported in milliseconds to avoid floating-point ambiguity at the μs level.
 *
 * `hzPerOp` is tinybench's `throughput.mean` multiplied by `batch` — i.e. operations
 * per second per *logical* operation, not per bench-closure invocation. Use this
 * for reading the table; use `hzPerIteration` when debugging the raw tinybench
 * data.
 *
 * @since 0.3.16-canary.0
 */
export interface ScenarioTrialResult {
  readonly id: string;
  readonly group: string;
  readonly stress: boolean;
  readonly excludeFromAggregates: boolean;
  readonly batch: number;
  readonly what: string;
  readonly hzPerIteration: number;
  readonly hzPerOp: number;
  readonly meanMs: number;
  readonly p75Ms: number;
  readonly p99Ms: number;
  readonly p999Ms: number;
  readonly samples: number;
}

/**
 * One per (library, trial) pair. Parent collects N trials per library and
 * aggregates into a `LibraryReport`.
 *
 * @since 0.3.16-canary.0
 */
export interface TrialPayload {
  readonly trialIndex: number;
  readonly scenarios: ReadonlyArray<ScenarioTrialResult>;
}

/**
 * Fingerprint of the environment the subprocess ran in — part of every
 * JSONL record so regressions can be correlated with Node / platform / CPU.
 *
 * @since 0.3.16-canary.0
 */
export interface Fingerprint {
  readonly nodeVersion: string;
  readonly v8Version: string;
  readonly platform: string;
  readonly arch: string;
  readonly cpuModel: string;
  readonly cpuCount: number;
  readonly nodeOptions: string;
  readonly libraryName: string;
  readonly libraryVersion: string;
  readonly gcExposed: boolean;
  readonly timestampIso: string;
}

/**
 * The complete result one bench subprocess emits to its parent.
 *
 * @since 0.3.16-canary.0
 */
export interface SubprocessPayload {
  readonly fingerprint: Fingerprint;
  readonly trials: ReadonlyArray<TrialPayload>;
  /** When non-empty, the harness failed sanity checks for these scenario IDs. */
  readonly sanityFailures: ReadonlyArray<string>;
  /** Every scenario id the library collected, in run order — before any filter narrowed the run. */
  readonly scenarioIds?: ReadonlyArray<string> | undefined;
}

/**
 * Serialises a subprocess payload with the mandatory framing markers.
 * Child processes must call this exactly once after finishing all trials.
 *
 * @since 0.3.16-canary.0
 */
export function emitSubprocessPayload(payload: SubprocessPayload): void {
  process.stdout.write(`\n${BENCH_RESULT_JSON_START}\n${JSON.stringify(payload)}\n${BENCH_RESULT_JSON_END}\n`);
}

function isTrialPayload(value: unknown): value is TrialPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate["trialIndex"] === "number" && Array.isArray(candidate["scenarios"]);
}

function isSubprocessPayload(value: unknown): value is SubprocessPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["fingerprint"] === "object" &&
    candidate["fingerprint"] !== null &&
    Array.isArray(candidate["trials"]) &&
    candidate["trials"].every(isTrialPayload) &&
    Array.isArray(candidate["sanityFailures"]) &&
    candidate["sanityFailures"].every((entry: unknown) => typeof entry === "string")
  );
}

/**
 * Extracts the JSON payload from captured child stdout. Returns `undefined`
 * when no framed block parses and validates.
 *
 * @remarks The last valid frame wins — the child emits its payload once, after all
 * trials, so scenario output echoing the marker strings cannot shadow it.
 *
 * @since 0.3.16-canary.0
 */
export function extractSubprocessPayload(stdout: string): SubprocessPayload | undefined {
  let payload: SubprocessPayload | undefined;
  let searchFrom = 0;
  for (;;) {
    const startIndex = stdout.indexOf(BENCH_RESULT_JSON_START, searchFrom);
    if (startIndex === -1) {
      break;
    }
    const jsonSliceStart = startIndex + BENCH_RESULT_JSON_START.length;
    const endIndex = stdout.indexOf(BENCH_RESULT_JSON_END, jsonSliceStart);
    if (endIndex === -1) {
      break;
    }
    const raw = stdout.slice(jsonSliceStart, endIndex).trim();
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSubprocessPayload(parsed)) {
        payload = parsed;
      }
    } catch {
      // A contaminated frame is skipped; a later frame may still be the real payload.
    }
    searchFrom = endIndex + BENCH_RESULT_JSON_END.length;
  }
  return payload;
}
