/**
 * Simple Variants Without Tailwind Merge Benchmark
 *
 * Benchmarks simple variant functionality without tailwind-merge
 */

import { Bench } from "tinybench";

import { cva, codefastTV, originalTV } from "#/benchmark-tv";
import { buttonVariants, simpleTestProps } from "#/benchmarks/simple/data";

// Initialize benchmark functions
const originalTVSimple = originalTV(buttonVariants, { twMerge: false });
const codefastTVSimple = codefastTV(buttonVariants, { twMerge: false });
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
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("tailwind-variants", () => {
      for (const props of simpleTestProps) {
        originalTVSimple(props);
      }
    })
    .add("class-variance-authority", () => {
      for (const props of simpleTestProps) {
        cvaSimple(props);
      }
    })
    .add("@codefast/tailwind-variants", () => {
      for (const props of simpleTestProps) {
        codefastTVSimple(props);
      }
    });

  return bench;
}
