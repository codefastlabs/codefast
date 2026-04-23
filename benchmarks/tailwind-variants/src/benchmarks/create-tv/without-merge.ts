/**
 * CreateTV Without Tailwind Merge Benchmark
 *
 * Benchmarks global factory configuration functionality without tailwind-merge
 */

import { Bench } from "tinybench";

import { codefastCreateTV, originalCreateTV } from "#/benchmark-tv";
import { buttonVariants, simpleTestProps } from "#/benchmarks/create-tv/data";

// Initialize global factories
const originalTVFactory = originalCreateTV({ twMerge: false });
const { tv: codefastTVFactory } = codefastCreateTV({ twMerge: false });

// Create variant functions using factories
const originalTVButton = originalTVFactory(buttonVariants);
const codefastTVButton = codefastTVFactory(buttonVariants);

/**
 * Create createTV benchmark without tailwind-merge
 */
export function createCreateTVWithoutMergeBenchmark(name = "CreateTV") {
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
        originalTVButton(props);
      }
    })
    .add("@codefast/tailwind-variants", () => {
      for (const props of simpleTestProps) {
        codefastTVButton(props);
      }
    });

  return bench;
}
