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
