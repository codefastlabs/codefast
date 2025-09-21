/**
 * Simple Variants With Tailwind Merge Benchmark
 *
 * Benchmarks simple variant functionality with tailwind-merge
 */

import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { buttonVariants, simpleTestProps } from "./data";

// Initialize benchmark functions
const originalTVSimple = originalTV(buttonVariants);
const codefastTVSimple = codefastTV(buttonVariants);

const cvaSimple = cva(buttonVariants.base, {
  defaultVariants: buttonVariants.defaultVariants,
  variants: buttonVariants.variants,
});

/**
 * Create simple variants benchmark with tailwind-merge
 */
export function createSimpleWithMergeBenchmark(): Bench {
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
        twMerge(cvaSimple(props));
      }
    })
    .add("[simple] @codefast/tailwind-variants", () => {
      for (const props of simpleTestProps) {
        codefastTVSimple(props);
      }
    });

  return bench;
}
