/**
 * Extreme Variants With Tailwind Merge Benchmark
 *
 * Stress test with maximum complexity - with tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { extremeTestProps, extremeVariants } from "./data.js";
import { tv as codefastTV } from "@codefast/tailwind-variants";

// Initialize benchmark functions
const originalTVExtreme = originalTV(extremeVariants);
const codefastTVExtreme = codefastTV(extremeVariants);

/**
 * Create extreme variants benchmark with tailwind-merge
 */
export function createExtremeWithMergeBenchmark(
  name = "Extreme Variants With Merge (240+ colors, 70+ compounds)",
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
