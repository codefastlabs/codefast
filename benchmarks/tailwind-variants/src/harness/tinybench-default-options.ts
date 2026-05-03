import type { BenchOptions } from "tinybench";

/**
 * Default tinybench profile for this suite when `BENCH_FAST` and `BENCH_FULL` are unset.
 */
export const BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS = {
  time: 1000,
  iterations: 1000,
  warmupTime: 100,
  warmupIterations: 100,
} satisfies BenchOptions;
