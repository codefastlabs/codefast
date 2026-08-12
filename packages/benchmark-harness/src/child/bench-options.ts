import type { BenchOptions } from "tinybench";

/**
 * Default tinybench `Bench` timing for the default profile.
 * The trial harness substitutes shorter or longer presets in the fast and full profiles.
 *
 * @since 0.3.16-canary.0
 */
export const BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS: BenchOptions = {
  time: 50,
  iterations: 100,
  warmupTime: 10,
  warmupIterations: 10,
} satisfies BenchOptions;
