/**
 * Simple Variants Without Tailwind Merge Benchmark
 *
 * Benchmarks simple variant functionality without tailwind-merge
 */

import { cva } from "class-variance-authority";
import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { buttonVariants, simpleTestProps } from "@/data";
import { tv as codefastTV } from "@codefast/tailwind-variants";

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
export function createSimpleWithoutMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("[simple] tailwind-variants", () => {
      for (const props of simpleTestProps) {
        originalTVSimple(props);
      }
    })
    .add("[simple] class-variance-authority", () => {
      for (const props of simpleTestProps) {
        cvaSimple(props);
      }
    })
    .add("[simple] @codefast/tailwind-variants", () => {
      for (const props of simpleTestProps) {
        codefastTVSimple(props);
      }
    });

  return bench;
}
