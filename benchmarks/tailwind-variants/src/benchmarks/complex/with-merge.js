/**
 * Complex Variants With Tailwind Merge Benchmark
 *
 * Benchmarks complex variant functionality with tailwind-merge
 */

import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { complexTestProps, complexVariants } from "./data.js";
import { tv as codefastTV } from "@codefast/tailwind-variants";

// Initialize benchmark functions
const originalTVComplex = originalTV(complexVariants);
const codefastTVComplex = codefastTV(complexVariants);
const cvaComplex = cva(complexVariants.base, {
  compoundVariants: complexVariants.compoundVariants,
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

/**
 * Create complex variants benchmark with tailwind-merge
 */
export function createComplexWithMergeBenchmark() {
  const bench = new Bench({
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("tailwind-variants", () => {
      for (const props of complexTestProps) {
        originalTVComplex(props);
      }
    })
    .add("class-variance-authority", () => {
      for (const props of complexTestProps) {
        twMerge(cvaComplex(props));
      }
    })
    .add("@codefast/tailwind-variants", () => {
      for (const props of complexTestProps) {
        codefastTVComplex(props);
      }
    });

  return bench;
}
