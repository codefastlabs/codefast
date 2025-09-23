/**
 * Simple Variants With Tailwind Merge Benchmark
 *
 * Benchmarks simple variant functionality with tailwind-merge
 */

import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { buttonVariants, simpleTestProps } from "./data.js";
import { tv as codefastTV } from "@codefast/tailwind-variants";

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
export function createSimpleWithMergeBenchmark(name = "Simple Variants (With Tailwind Merge)") {
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
        twMerge(cvaSimple(props));
      }
    })
    .add("@codefast/tailwind-variants", () => {
      for (const props of simpleTestProps) {
        codefastTVSimple(props);
      }
    });

  return bench;
}
