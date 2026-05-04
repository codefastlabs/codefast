import type { BenchOptions } from "tinybench";

/**
 * Default tinybench `Bench` timing when `BENCH_FAST` and `BENCH_FULL` are not set.
 * The trial harness substitutes shorter or longer presets when either flag is on.
 *
 * @since 0.3.16-canary.0
 */
export const BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS = {
  time: 50,
  iterations: 100,
  warmupTime: 10,
  warmupIterations: 10,
} satisfies BenchOptions;
