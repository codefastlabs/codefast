/**
 * Env var keys and protocol-level file name constants shared across the benchmark harness.
 *
 * @since 0.3.16-canary.0
 */

/**
 * Timing profile for the run: `fast`, `default`, or `full`.
 */
export const BENCH_MODE_ENV_KEY = "BENCH_MODE";
/**
 * @since 0.3.16-canary.0
 */
export const BENCH_VERBOSE_ENV_KEY = "BENCH_VERBOSE";
/**
 * @since 0.3.16-canary.0
 */
export const BENCH_PORT_ENV_KEY = "BENCH_PORT";
/**
 * Overrides the per-scenario trial count (minimum 3); unset/empty uses the mode default.
 *
 * @since 0.5.0-canary.7
 */
export const BENCH_TRIALS_ENV_KEY = "BENCH_TRIALS";
/**
 * When enabled, the parent runs each scenario in its own subprocess so hot-path inline
 * caches trained by one scenario cannot skew another (order-independence).
 *
 * @since 0.5.0-canary.7
 */
export const BENCH_ISOLATE_ENV_KEY = "BENCH_ISOLATE";
/**
 * Restricts the run to these scenario ids, comma-separated.
 *
 * @remarks Honoured at both levels — set it yourself to bench one row through the full parent
 * report, and the parent sets it per scenario in isolated mode. A library implementing none of the
 * ids measures nothing instead of failing, so a row only some libraries have is still runnable.
 *
 * @since 0.5.0-canary.7
 */
export const BENCH_ONLY_ENV_KEY = "BENCH_ONLY";
/**
 * Child-side: emit the scenario id list without running anything (isolated-mode discovery).
 *
 * @since 0.5.0-canary.7
 */
export const BENCH_LIST_ENV_KEY = "BENCH_LIST";
/**
 * File written inside each timestamped run directory by {@link writeJsonlRun}.
 *
 * @since 0.3.16-canary.0
 */
export const OBSERVATIONS_FILE_NAME = "observations.jsonl";
/**
 * Directory name where timestamped run subdirectories are written.
 *
 * @since 0.3.16-canary.0
 */
export const BENCH_RESULTS_DIR_NAME = "bench-results";

const TRUTHY_FLAG_VALUES: ReadonlySet<string> = new Set(["1", "true", "yes", "on"]);
// The empty string covers both an unset key and one exported as `KEY=`.
const FALSY_FLAG_VALUES: ReadonlySet<string> = new Set(["", "0", "false", "no", "off"]);

/**
 * Reads an on/off env flag, accepting any of `1`/`true`/`yes`/`on` in either case.
 *
 * @remarks Throws on an unrecognised value rather than reading it as off: a profile that
 * silently fails to turn on yields numbers for a different run than the one asked for, and
 * nothing downstream can tell that apart from a real measurement.
 */
export function isEnvFlagEnabled(key: string): boolean {
  const rawValue = process.env[key] ?? "";
  const normalizedValue = rawValue.trim().toLowerCase();
  if (TRUTHY_FLAG_VALUES.has(normalizedValue)) {
    return true;
  }
  if (FALSY_FLAG_VALUES.has(normalizedValue)) {
    return false;
  }
  throw new Error(
    `${key}="${rawValue}" is not an on/off value. Enable with 1, true, yes or on; disable with 0, false, no, off, or leave it unset.`,
  );
}

/**
 * Timing profile for a bench run: `fast` for smoke checks, `full` for GC-enabled stability runs.
 *
 * @since 0.5.0-canary.7
 */
export type BenchMode = "fast" | "full";

/** `BENCH_MODE` spelling for the profile that is neither fast nor full. */
const DEFAULT_BENCH_MODE_VALUE = "default";

// Keys the harness no longer reads. Left unguarded, each would be an env var that sets
// nothing while looking like it selected a profile.
const RETIRED_MODE_ENV_KEYS: ReadonlyMap<string, BenchMode> = new Map([
  ["BENCH_FAST", "fast"],
  ["BENCH_FULL", "full"],
]);

/**
 * Resolves the timing profile from {@link BENCH_MODE_ENV_KEY}; `undefined` means the default
 * profile.
 *
 * @remarks One key with three values, rather than a flag per profile: the profiles are mutually
 * exclusive, so a flag pair can express a both-on state that has no meaning.
 */
export function resolveBenchModeFromEnvironment(): BenchMode | undefined {
  for (const [retiredKey, replacementMode] of RETIRED_MODE_ENV_KEYS) {
    if (process.env[retiredKey] !== undefined) {
      throw new Error(`${retiredKey} is not read. Use ${BENCH_MODE_ENV_KEY}=${replacementMode} instead.`);
    }
  }
  const rawValue = process.env[BENCH_MODE_ENV_KEY] ?? "";
  const requestedMode = rawValue.trim().toLowerCase();
  if (requestedMode.length === 0 || requestedMode === DEFAULT_BENCH_MODE_VALUE) {
    return undefined;
  }
  if (requestedMode === "fast" || requestedMode === "full") {
    return requestedMode;
  }
  throw new Error(
    `${BENCH_MODE_ENV_KEY}="${rawValue}" is not a bench mode. Use fast, ${DEFAULT_BENCH_MODE_VALUE}, or full.`,
  );
}

/**
 * Parses {@link BENCH_ONLY_ENV_KEY} into the set of ids to keep.
 *
 * @returns `undefined` when nothing was requested, which means run everything — distinct from an
 * empty set, which would mean run nothing.
 */
export function parseScenarioFilter(value: string | undefined): ReadonlySet<string> | undefined {
  if (value === undefined) {
    return undefined;
  }
  const ids = value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return ids.length === 0 ? undefined : new Set(ids);
}
