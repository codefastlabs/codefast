/**
 * Simple Variants Without Tailwind Merge Benchmark
 *
 * Benchmarks simple variant functionality without tailwind-merge
 */

import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_DISABLED } from "#/bench-options";
import { cva, codefastTV, originalTV } from "#/benchmark-tv";
import { buttonVariants, simpleTestProps } from "#/benchmarks/simple/data";

// Initialize benchmark functions
const originalTVSimple = originalTV(buttonVariants, TV_MERGE_DISABLED);
const codefastTVSimple = codefastTV(buttonVariants, TV_MERGE_DISABLED);
const cvaSimple = cva(buttonVariants.base, {
  defaultVariants: buttonVariants.defaultVariants,
  variants: buttonVariants.variants,
});

/**
 * Create simple variants benchmark without tailwind-merge
 */
export function createSimpleWithoutMergeBenchmark(name = "Simple Variants") {
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
        cvaSimple(props);
      }
    });

  return bench;
}
