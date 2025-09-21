/**
 * Complex Variants With Tailwind Merge Benchmark
 *
 * Benchmarks complex variant functionality with tailwind-merge
 */

import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { complexTestProps, complexVariants, mutableComplexVariants } from "./data";

// Initialize benchmark functions
const originalTVComplex = originalTV(mutableComplexVariants);
const codefastTVComplex = codefastTV(mutableComplexVariants);

const cvaComplex = cva(complexVariants.base, {
  compoundVariants: [...complexVariants.compoundVariants],
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

/**
 * Create complex variants benchmark with tailwind-merge
 */
export function createComplexWithMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("[complex] tailwind-variants", () => {
      for (const props of complexTestProps) {
        originalTVComplex(props);
      }
    })
    .add("[complex] class-variance-authority", () => {
      for (const props of complexTestProps) {
        twMerge(cvaComplex(props));
      }
    })
    .add("[complex] @codefast/tailwind-variants", () => {
      for (const props of complexTestProps) {
        codefastTVComplex(props);
      }
    });

  return bench;
}
