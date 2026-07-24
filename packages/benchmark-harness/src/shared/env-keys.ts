/**
 * Env var keys and protocol-level file name constants shared across the benchmark harness.
 *
 * @since 0.3.16-canary.0
 */

export const BENCH_FAST_ENV_KEY = "BENCH_FAST";
/**
 * @since 0.3.16-canary.0
 */
export const BENCH_FULL_ENV_KEY = "BENCH_FULL";
/**
 * @since 0.3.16-canary.0
 */
export const BENCH_VERBOSE_ENV_KEY = "BENCH_VERBOSE";
/**
 * @since 0.3.16-canary.0
 */
export const BENCH_PORT_ENV_KEY = "BENCH_PORT";
/**
 * Overrides the per-scenario trial count (minimum 2); unset/empty uses the mode default.
 *
 * @since 0.5.0-canary.7
 */
export const BENCH_TRIALS_ENV_KEY = "BENCH_TRIALS";
/**
 * When "1", the parent runs each scenario in its own subprocess so hot-path inline
 * caches trained by one scenario cannot skew another (order-independence).
 *
 * @since 0.5.0-canary.7
 */
export const BENCH_ISOLATE_ENV_KEY = "BENCH_ISOLATE";
/**
 * Child-side: run only this scenario id (set by the parent in isolated mode).
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
