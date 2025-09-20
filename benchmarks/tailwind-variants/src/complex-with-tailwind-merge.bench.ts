/**
 * Complex Variants With Tailwind Merge Benchmark
 *
 * This benchmark compares the performance of different Tailwind CSS variant libraries
 * for complex variants with tailwind-merge functionality.
 */

import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { complexTestProps, complexVariants, mutableComplexVariants } from "./shared-data";

// Initialize benchmark functions
const originalTVComplex = originalTV(mutableComplexVariants);
const codefastTVComplex = codefastTV(mutableComplexVariants);

const cvaComplex = cva(complexVariants.base, {
  compoundVariants: [...complexVariants.compoundVariants],
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

/**
 * Run complex variants benchmark with tailwind-merge
 */
export function runComplexWithTailwindMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000, // 1000 iterations
    time: 1000, // 1 second per benchmark
    warmupIterations: 100, // 100 warmup iterations
  });

  console.log("\n=== Complex Variants (With Tailwind Merge) Benchmark ===");

  bench.add("[complex] tailwind-variants (original) + tailwind-merge", () => {
    for (const props of complexTestProps) {
      originalTVComplex(props);
    }
  });

  bench.add("[complex] class-variance-authority + tailwind-merge", () => {
    for (const props of complexTestProps) {
      twMerge(cvaComplex(props));
    }
  });

  bench.add("[complex] @codefast/tailwind-variants + tailwind-merge", () => {
    for (const props of complexTestProps) {
      codefastTVComplex(props);
    }
  });

  return bench;
}
