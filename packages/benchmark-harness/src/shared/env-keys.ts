/** Env var keys and protocol-level file name constants shared across the benchmark harness. */

export const BENCH_FAST_ENV_KEY = "BENCH_FAST";
export const BENCH_FULL_ENV_KEY = "BENCH_FULL";
export const BENCH_VERBOSE_ENV_KEY = "BENCH_VERBOSE";
export const BENCH_PORT_ENV_KEY = "BENCH_PORT";

/** File written inside each timestamped run directory by {@link writeJsonlRun}. */
export const OBSERVATIONS_FILE_NAME = "observations.jsonl";

/** Directory name where timestamped run subdirectories are written. */
export const BENCH_RESULTS_DIR_NAME = "bench-results";
