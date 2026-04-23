/**
 * CreateTV With Tailwind Merge Benchmark
 *
 * Benchmarks global factory configuration functionality with tailwind-merge
 */

import { Bench } from "tinybench";

import { codefastCreateTV, originalCreateTV } from "#/benchmark-tv";
import { buttonVariants, simpleTestProps } from "#/benchmarks/create-tv/data";

// Initialize global factories
const originalTVFactory = originalCreateTV({ twMerge: true });
const { tv: codefastTVFactory } = codefastCreateTV({ twMerge: true });

// Create variant functions using factories
const originalTVButton = originalTVFactory(buttonVariants);
const codefastTVButton = codefastTVFactory(buttonVariants);

/**
 * Create createTV benchmark with tailwind-merge
 */
export function createCreateTVWithMergeBenchmark(name = "CreateTV (With Tailwind Merge)") {
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
