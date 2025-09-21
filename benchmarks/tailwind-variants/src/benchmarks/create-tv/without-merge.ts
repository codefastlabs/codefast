/**
 * CreateTV Without Tailwind Merge Benchmark
 *
 * Benchmarks global factory configuration functionality without tailwind-merge
 */

import { createTV as originalCreateTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { buttonVariants, simpleTestProps } from "@/benchmarks/create-tv/data";
import { createTV as codefastCreateTV } from "@codefast/tailwind-variants";

// Initialize global factories
const originalTVFactory = originalCreateTV({ twMerge: false });
const { tv: codefastTVFactory } = codefastCreateTV({ twMerge: false });

// Create variant functions using factories
const originalTVButton = originalTVFactory(buttonVariants);
const codefastTVButton = codefastTVFactory(buttonVariants);

/**
 * Create createTV benchmark without tailwind-merge
 */
export function createCreateTVWithoutMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("[create-tv] tailwind-variants", () => {
      for (const props of simpleTestProps) {
        originalTVButton(props);
      }
    })
    .add("[create-tv] @codefast/tailwind-variants", () => {
      for (const props of simpleTestProps) {
        codefastTVButton(props);
      }
    });

  return bench;
}
