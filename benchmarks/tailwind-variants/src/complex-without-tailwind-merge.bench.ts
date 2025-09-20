/**
 * Complex Variants Without Tailwind Merge Benchmark
 *
 * This benchmark compares the performance of different Tailwind CSS variant libraries
 * for complex variants without tailwind-merge functionality.
 */

import { cva } from "class-variance-authority";
import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { complexTestProps, complexVariants, mutableComplexVariants } from "./shared-data";

// Initialize benchmark functions
const originalTVComplex = originalTV(mutableComplexVariants, { twMerge: false });
const codefastTVComplex = codefastTV(mutableComplexVariants, { twMerge: false });

const cvaComplex = cva(complexVariants.base, {
  compoundVariants: [...complexVariants.compoundVariants],
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

/**
 * Run complex variants benchmark without tailwind-merge
 */
export function runComplexWithoutTailwindMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000, // 1000 iterations
    time: 1000, // 1 second per benchmark
    warmupIterations: 100, // 100 warmup iterations
  });

  console.log("\n=== Complex Variants (Without Tailwind Merge) Benchmark ===");

  bench.add("[complex] tailwind-variants (original)", () => {
    for (const props of complexTestProps) {
      originalTVComplex(props);
    }
  });

  bench.add("[complex] class-variance-authority", () => {
    for (const props of complexTestProps) {
      cvaComplex(props);
    }
  });

  bench.add("[complex] @codefast/tailwind-variants", () => {
    for (const props of complexTestProps) {
      codefastTVComplex(props);
    }
  });

  return bench;
}
