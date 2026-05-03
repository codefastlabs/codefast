import type { BenchOptions } from "tinybench";

/**
 * Default tinybench profile for this suite when `BENCH_FAST` and `BENCH_FULL` are unset.
 */
export const BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS = {
  time: 50,
  iterations: 100,
  warmupTime: 10,
  warmupIterations: 10,
} satisfies BenchOptions;
