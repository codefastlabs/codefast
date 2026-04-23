/**
 * Extreme Variants Without Tailwind Merge Benchmark
 *
 * Stress test with maximum complexity - no tailwind-merge
 */

import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_DISABLED } from "#/bench-options";
import { codefastTV, originalTV } from "#/benchmark-tv";
import { extremeTestProps, extremeVariants } from "#/benchmarks/extreme/data";

// Initialize benchmark functions
const originalTVExtreme = originalTV(extremeVariants, TV_MERGE_DISABLED);
const codefastTVExtreme = codefastTV(extremeVariants, TV_MERGE_DISABLED);

/**
 * Create extreme variants benchmark without tailwind-merge
 */
export function createExtremeWithoutMergeBenchmark(
  name = "Extreme Variants (240+ colors, 70+ compounds)",
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
