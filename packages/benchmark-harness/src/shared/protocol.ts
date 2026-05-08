/**
 * Wire protocol between per-library bench subprocesses and the parent runner.
 *
 * Each library's bench file prints one JSON payload delimited by explicit
 * START/END markers. The parent looks *only* for content between those markers,
 * so Node deprecation warnings, tsx banners, or stray `console.log`s never
 * contaminate parsing. This replaces the previous fragile "last non-empty
 * stdout line" heuristic.
 *
 * @since 0.3.16-canary.0
 */

export const BENCH_RESULT_JSON_START = "BENCH_RESULT_JSON_START";
/**
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
 * @since 0.3.16-canary.0
 */
export interface SubprocessPayload {
  readonly fingerprint: Fingerprint;
  readonly trials: ReadonlyArray<TrialPayload>;
  /** When non-empty, the harness failed sanity checks for these scenario IDs. */
  readonly sanityFailures: ReadonlyArray<string>;
}

/**
 * Serialises a subprocess payload with the mandatory framing markers.
 * Child processes must call this exactly once after finishing all trials.
 *
 * @since 0.3.16-canary.0
 */
export function emitSubprocessPayload(payload: SubprocessPayload): void {
  process.stdout.write(
    `\n${BENCH_RESULT_JSON_START}\n${JSON.stringify(payload)}\n${BENCH_RESULT_JSON_END}\n`,
  );
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
    Array.isArray(candidate["sanityFailures"])
  );
}

/**
 * Extracts the JSON payload from captured child stdout. Returns `undefined`
 * when markers are missing, content fails to parse, or the shape is invalid.
 *
 * @since 0.3.16-canary.0
 */
export function extractSubprocessPayload(stdout: string): SubprocessPayload | undefined {
  const startIndex = stdout.indexOf(BENCH_RESULT_JSON_START);
  const endIndex = stdout.indexOf(BENCH_RESULT_JSON_END, startIndex);
  if (startIndex === -1 || endIndex === -1) {
    return undefined;
  }
  const jsonSliceStart = startIndex + BENCH_RESULT_JSON_START.length;
  const raw = stdout.slice(jsonSliceStart, endIndex).trim();
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSubprocessPayload(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
