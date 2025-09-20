/**
 * Simple Variants Without Tailwind Merge Benchmark
 *
 * This benchmark compares the performance of different Tailwind CSS variant libraries
 * for simple variants without tailwind-merge functionality.
 */

import { cva } from "class-variance-authority";
import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { buttonVariants, simpleTestProps } from "./shared-data";

// Initialize benchmark functions
const originalTVSimple = originalTV(buttonVariants, { twMerge: false });
const codefastTVSimple = codefastTV(buttonVariants, { twMerge: false });

const cvaSimple = cva(buttonVariants.base, {
  defaultVariants: buttonVariants.defaultVariants,
  variants: buttonVariants.variants,
});

/**
 * Run simple variants benchmark without tailwind-merge
 */
export function runSimpleWithoutTailwindMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000, // 1000 iterations
    time: 1000, // 1 second per benchmark
    warmupIterations: 100, // 100 warmup iterations
  });

  console.log("=== Simple Variants (Without Tailwind Merge) Benchmark ===");

  bench.add("[simple] tailwind-variants (original)", () => {
    for (const props of simpleTestProps) {
      originalTVSimple(props);
    }
  });

  bench.add("[simple] class-variance-authority", () => {
    for (const props of simpleTestProps) {
      cvaSimple(props);
    }
  });

  bench.add("[simple] @codefast/tailwind-variants", () => {
    for (const props of simpleTestProps) {
      codefastTVSimple(props);
    }
  });

  return bench;
}
