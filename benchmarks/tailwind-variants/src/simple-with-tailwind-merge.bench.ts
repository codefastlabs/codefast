/**
 * Simple Variants With Tailwind Merge Benchmark
 *
 * This benchmark compares the performance of different Tailwind CSS variant libraries
 * for simple variants with tailwind-merge functionality.
 */

import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { buttonVariants, simpleTestProps } from "./shared-data";

// Initialize benchmark functions
const originalTVSimple = originalTV(buttonVariants);
const codefastTVSimple = codefastTV(buttonVariants);

const cvaSimple = cva(buttonVariants.base, {
  defaultVariants: buttonVariants.defaultVariants,
  variants: buttonVariants.variants,
});

/**
 * Run simple variants benchmark with tailwind-merge
 */
export function runSimpleWithTailwindMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000, // 1000 iterations
    time: 1000, // 1 second per benchmark
    warmupIterations: 100, // 100 warmup iterations
  });

  console.log("\n=== Simple Variants (With Tailwind Merge) Benchmark ===");

  bench.add("[simple] tailwind-variants (original) + tailwind-merge", () => {
    for (const props of simpleTestProps) {
      originalTVSimple(props);
    }
  });

  bench.add("[simple] class-variance-authority + tailwind-merge", () => {
    for (const props of simpleTestProps) {
      twMerge(cvaSimple(props));
    }
  });

  bench.add("[simple] @codefast/tailwind-variants + tailwind-merge", () => {
    for (const props of simpleTestProps) {
      codefastTVSimple(props);
    }
  });

  return bench;
}
