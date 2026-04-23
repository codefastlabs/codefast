/**
 * Extreme Variants Without Tailwind Merge Benchmark
 *
 * Stress test with maximum complexity - no tailwind-merge
 */

import { Bench } from "tinybench";

import { codefastTV, originalTV } from "#/benchmark-tv";
import { extremeTestProps, extremeVariants } from "#/benchmarks/extreme/data";

// Initialize benchmark functions
const originalTVExtreme = originalTV(extremeVariants, { twMerge: false });
const codefastTVExtreme = codefastTV(extremeVariants, { twMerge: false });

/**
 * Create extreme variants benchmark without tailwind-merge
 */
export function createExtremeWithoutMergeBenchmark(
  name = "Extreme Variants (240+ colors, 70+ compounds)",
) {
  const bench = new Bench({
    name,
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
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
