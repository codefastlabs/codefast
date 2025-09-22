/**
 * CreateTV With Tailwind Merge Benchmark
 *
 * Benchmarks global factory configuration functionality with tailwind-merge
 */

import { createTV as originalCreateTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { buttonVariants, simpleTestProps } from "./data.js";
import { createTV as codefastCreateTV } from "@codefast/tailwind-variants";

// Initialize global factories
const originalTVFactory = originalCreateTV({ twMerge: true });
const { tv: codefastTVFactory } = codefastCreateTV({ twMerge: true });

// Create variant functions using factories
const originalTVButton = originalTVFactory(buttonVariants);
const codefastTVButton = codefastTVFactory(buttonVariants);

/**
 * Create createTV benchmark with tailwind-merge
 */
export function createCreateTVWithMergeBenchmark() {
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
