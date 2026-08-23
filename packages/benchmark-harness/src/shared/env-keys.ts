/**
 * The `BENCH_*` environment surface: one spec per key, and every parser derived from it.
 *
 * @since 0.3.16-canary.0
 */

/**
 * Timing profile for the run: `fast`, `default`, or `full`.
 *
 * @since 0.6.0
 */
export const BENCH_MODE_ENV_KEY = "BENCH_MODE";
/**
 * When enabled, forwards each child's stdout lines through the parent's output.
 *
 * @since 0.3.16-canary.0
 */
export const BENCH_VERBOSE_ENV_KEY = "BENCH_VERBOSE";
/**
 * Port the benchmark results viewer (`bench:serve`) listens on.
 *
 * @since 0.3.16-canary.0
 */
export const BENCH_PORT_ENV_KEY = "BENCH_PORT";
/**
 * Overrides the per-scenario trial count; unset/empty uses the mode default.
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
 * @remarks Internal to the parent/child protocol — the parent strips it from every inherited child
 * environment and sets it only per subprocess, so a value from the surrounding shell cannot put a
 * measuring child into discovery mode.
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

/**
 * Fewest trials that can carry a median: with two, the median is their mean and cannot separate a
 * change from noise.
 *
 * @since 0.6.0
 */
export const MINIMUM_TRIAL_COUNT = 3;

/** Highest port a TCP listener accepts. */
const MAXIMUM_PORT = 65_535;

/** Accepted {@link BENCH_MODE_ENV_KEY} values, in escalating cost order. */
const BENCH_MODE_VALUES = ["fast", "default", "full"] as const;

/** The Turbo tasks that actually run a suite, as opposed to serving its history. */
const MEASURING_TURBO_TASKS = ["bench", "bench:isolate"] as const;

type BenchEnvValueSpec =
  | { readonly kind: "flag" }
  | { readonly kind: "enum"; readonly values: ReadonlyArray<string> }
  | { readonly kind: "integer"; readonly min: number; readonly max?: number | undefined }
  | { readonly kind: "list" }
  | { readonly kind: "string" };

/**
 * What a `BENCH_*` key accepts and who is allowed to set it.
 *
 * @remarks `turboTasks` is required on user-facing keys because Turbo runs in strict env mode: a key
 * absent from a task's `passThroughEnv` is dropped for any run started from the repo root, which
 * looks exactly like the key having no effect.
 *
 * @since 0.6.0
 */
export type BenchEnvSpec =
  | ({ readonly audience: "user"; readonly turboTasks: ReadonlyArray<string> } & BenchEnvValueSpec)
  | ({ readonly audience: "internal" } & BenchEnvValueSpec)
  | { readonly audience: "retired"; readonly replacement: string };

/**
 * Every key the harness owns in the `BENCH_*` namespace.
 *
 * @remarks The single source for value parsing, which keys the parent strips before spawning, which
 * keys Turbo must pass through, and which spellings are rejected outright.
 *
 * @since 0.6.0
 */
export const BENCH_ENV_SPECS: Readonly<Record<string, BenchEnvSpec>> = {
  BENCH_FAST: { audience: "retired", replacement: "BENCH_MODE=fast" },
  BENCH_FULL: { audience: "retired", replacement: "BENCH_MODE=full" },
  BENCH_ISOLATE: { audience: "user", kind: "flag", turboTasks: MEASURING_TURBO_TASKS },
  BENCH_LIST: { audience: "internal", kind: "flag" },
  BENCH_MODE: { audience: "user", kind: "enum", turboTasks: MEASURING_TURBO_TASKS, values: BENCH_MODE_VALUES },
  BENCH_ONLY: { audience: "user", kind: "list", turboTasks: MEASURING_TURBO_TASKS },
  BENCH_PORT: { audience: "user", kind: "integer", max: MAXIMUM_PORT, min: 1, turboTasks: ["bench:serve"] },
  BENCH_TRIALS: { audience: "user", kind: "integer", min: MINIMUM_TRIAL_COUNT, turboTasks: MEASURING_TURBO_TASKS },
  BENCH_VERBOSE: { audience: "user", kind: "flag", turboTasks: MEASURING_TURBO_TASKS },
};

const BENCH_ENV_SPEC_ENTRIES: ReadonlyArray<readonly [string, BenchEnvSpec]> = Object.entries(BENCH_ENV_SPECS);

/**
 * Keys a person is meant to set.
 *
 * @since 0.6.0
 */
export const USER_BENCH_ENV_KEYS: ReadonlyArray<string> = BENCH_ENV_SPEC_ENTRIES.filter(
  ([, spec]) => spec.audience === "user",
).map(([key]) => key);

/**
 * Keys the parent sets per subprocess and strips from anything a child inherits.
 *
 * @since 0.6.0
 */
export const INTERNAL_BENCH_ENV_KEYS: ReadonlyArray<string> = BENCH_ENV_SPEC_ENTRIES.filter(
  ([, spec]) => spec.audience === "internal",
).map(([key]) => key);

const TRUTHY_FLAG_VALUES: ReadonlySet<string> = new Set(["1", "true", "yes", "on"]);
// The empty string covers both an unset key and one exported as `KEY=`.
const FALSY_FLAG_VALUES: ReadonlySet<string> = new Set(["", "0", "false", "no", "off"]);

function readNormalized(key: string): { normalizedValue: string; rawValue: string } {
  const rawValue = process.env[key] ?? "";
  return { normalizedValue: rawValue.trim().toLowerCase(), rawValue };
}

/**
 * Reads an on/off env flag, accepting any of `1`/`true`/`yes`/`on` in either case.
 *
 * @remarks Throws on an unrecognised value rather than reading it as off: a profile that
 * silently fails to turn on yields numbers for a different run than the one asked for, and
 * nothing downstream can tell that apart from a real measurement.
 *
 * @since 0.6.0
 */
export function isEnvFlagEnabled(key: string): boolean {
  const { normalizedValue, rawValue } = readNormalized(key);
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
 * Bounds for {@link parseEnvInteger} when the key is owned by a suite rather than by
 * {@link BENCH_ENV_SPECS}.
 *
 * @since 0.6.0
 */
export type IntegerEnvBounds = Readonly<{ min: number; max?: number | undefined }>;

function resolveIntegerBounds(key: string, bounds: IntegerEnvBounds | undefined): IntegerEnvBounds {
  if (bounds !== undefined) {
    return bounds;
  }
  const spec = BENCH_ENV_SPECS[key];
  if (spec === undefined || spec.audience === "retired" || spec.kind !== "integer") {
    throw new Error(`${key} is not an integer key in BENCH_ENV_SPECS; pass explicit bounds to read it.`);
  }
  return { max: spec.max, min: spec.min };
}

/**
 * Reads a whole-number env value, or `undefined` when the key is unset or empty.
 *
 * @remarks Rejects anything a bare `Number()`/`parseInt` would wave through — a trailing-junk value
 * like `3abc`, an exponent `parseInt` truncates to a different number, a fraction, or an
 * out-of-range port. Each of those otherwise reaches a benchmark as a plausible figure.
 *
 * @param key - The environment variable to read.
 * @param bounds - Required for keys a suite owns; harness keys read theirs from the spec.
 *
 * @since 0.6.0
 */
export function parseEnvInteger(key: string, bounds?: IntegerEnvBounds): number | undefined {
  const { min, max } = resolveIntegerBounds(key, bounds);
  const { normalizedValue, rawValue } = readNormalized(key);
  if (normalizedValue.length === 0) {
    return undefined;
  }
  const range = max === undefined ? `at least ${String(min)}` : `between ${String(min)} and ${String(max)}`;
  if (!/^\d+$/.test(normalizedValue)) {
    throw new Error(`${key}="${rawValue}" is not a whole number. Use a digits-only value ${range}.`);
  }
  const parsedValue = Number(normalizedValue);
  if (parsedValue < min || (max !== undefined && parsedValue > max)) {
    throw new Error(`${key}="${rawValue}" is out of range. Use a whole number ${range}.`);
  }
  return parsedValue;
}

/**
 * Timing profile for a bench run: `fast` for smoke checks, `full` for GC-enabled stability runs.
 *
 * @since 0.5.0-canary.7
 */
export type BenchMode = "fast" | "full";

/** `BENCH_MODE` spelling for the profile that is neither fast nor full. */
const DEFAULT_BENCH_MODE_VALUE = "default";

/**
 * Resolves the timing profile from {@link BENCH_MODE_ENV_KEY}; `undefined` means the default
 * profile.
 *
 * @remarks One key with three values, rather than a flag per profile: the profiles are mutually
 * exclusive, so a flag pair can express a both-on state that has no meaning.
 *
 * @since 0.6.0
 */
export function resolveBenchModeFromEnvironment(): BenchMode | undefined {
  const { normalizedValue, rawValue } = readNormalized(BENCH_MODE_ENV_KEY);
  if (normalizedValue.length === 0 || normalizedValue === DEFAULT_BENCH_MODE_VALUE) {
    return undefined;
  }
  if (normalizedValue === "fast" || normalizedValue === "full") {
    return normalizedValue;
  }
  throw new Error(`${BENCH_MODE_ENV_KEY}="${rawValue}" is not a bench mode. Use ${BENCH_MODE_VALUES.join(", ")}.`);
}

/**
 * Options for {@link assertBenchEnvKeys}.
 *
 * @since 0.6.0
 */
export type AssertBenchEnvKeysOptions = Readonly<{
  /** Set on a bench child, which legitimately receives the protocol keys from its parent. */
  allowInternalKeys?: boolean | undefined;
  /** `BENCH_*` keys the calling suite owns, which the harness spec map does not list. */
  extraKeys?: ReadonlySet<string> | undefined;
}>;

/**
 * Rejects any `BENCH_*` key the harness does not read, before a run starts.
 *
 * @remarks The values are validated strictly, so a misspelled *key* was the one remaining way to
 * ask for something and be ignored — `BENCH_MODEE=fast` selects nothing and says nothing.
 *
 * @since 0.6.0
 */
export function assertBenchEnvKeys(options: AssertBenchEnvKeysOptions = {}): void {
  const { allowInternalKeys = false, extraKeys } = options;
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith("BENCH_") || extraKeys?.has(key) === true) {
      continue;
    }
    const spec = BENCH_ENV_SPECS[key];
    if (spec === undefined) {
      throw new Error(
        `${key} is not a bench environment key. Known keys: ${[...USER_BENCH_ENV_KEYS].sort().join(", ")}.`,
      );
    }
    if (spec.audience === "retired") {
      throw new Error(`${key} is not read. Use ${spec.replacement} instead.`);
    }
    if (spec.audience === "internal" && !allowInternalKeys) {
      throw new Error(`${key} is set by the harness per subprocess, not from the shell.`);
    }
  }
}

/**
 * Parses {@link BENCH_ONLY_ENV_KEY} into the set of ids to keep.
 *
 * @returns `undefined` when nothing was requested, which means run everything — distinct from an
 * empty set, which would mean run nothing.
 *
 * @since 0.6.0
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
