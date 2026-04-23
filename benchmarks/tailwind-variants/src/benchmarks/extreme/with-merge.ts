/**
 * Extreme Variants With Tailwind Merge Benchmark
 *
 * Stress test with maximum complexity - with tailwind-merge
 */

import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_ENABLED } from "#/bench-options";
import { codefastTV, originalTV } from "#/benchmark-tv";
import { extremeTestProps, extremeVariants } from "#/benchmarks/extreme/data";

// Initialize benchmark functions
const originalTVExtreme = originalTV(extremeVariants, TV_MERGE_ENABLED);
const codefastTVExtreme = codefastTV(extremeVariants, TV_MERGE_ENABLED);

/**
 * Create extreme variants benchmark with tailwind-merge
 */
export function createExtremeWithMergeBenchmark(
  name = "Extreme Variants With Merge (240+ colors, 70+ compounds)",
) {
  const bench = new Bench({
    name,
    ...BENCH_OPTIONS,
  });

  bench
    .add("tailwind-variants", () => {
      for (const props of extremeTestProps) {
        originalTVExtreme(props);
      }
    })
    .add("@codefast/tailwind-variants", () => {
      for (const props of extremeTestProps) {
        codefastTVExtreme(props);
      }
    });

  return bench;
}
