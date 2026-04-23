/**
 * Simple Variants With Tailwind Merge Benchmark
 *
 * Benchmarks simple variant functionality with tailwind-merge
 */

import { twMerge } from "tailwind-merge";
import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_ENABLED } from "#/bench-options";
import { cva, codefastTV, originalTV } from "#/benchmark-tv";
import { buttonVariants, simpleTestProps } from "#/benchmarks/simple/data";

// Initialize benchmark functions
const originalTVSimple = originalTV(buttonVariants, TV_MERGE_ENABLED);
const codefastTVSimple = codefastTV(buttonVariants, TV_MERGE_ENABLED);
const cvaSimple = cva(buttonVariants.base, {
  defaultVariants: buttonVariants.defaultVariants,
  variants: buttonVariants.variants,
});

/**
 * Create simple variants benchmark with tailwind-merge
 */
export function createSimpleWithMergeBenchmark(name = "Simple Variants (With Tailwind Merge)") {
  const bench = new Bench({
    name,
    ...BENCH_OPTIONS,
  });

  bench
    .add("tailwind-variants", () => {
      for (const props of simpleTestProps) {
        originalTVSimple(props);
      }
    })
    .add("@codefast/tailwind-variants", () => {
      for (const props of simpleTestProps) {
        codefastTVSimple(props);
      }
    })
    .add("class-variance-authority", () => {
      for (const props of simpleTestProps) {
        twMerge(cvaSimple(props));
      }
    });

  return bench;
}
