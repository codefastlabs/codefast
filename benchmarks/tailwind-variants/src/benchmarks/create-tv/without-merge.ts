/**
 * CreateTV Without Tailwind Merge Benchmark
 *
 * Benchmarks global factory configuration functionality without tailwind-merge
 */

import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_DISABLED } from "#/bench-options";
import { codefastCreateTV, originalCreateTV } from "#/benchmark-tv";
import { buttonVariants, simpleTestProps } from "#/benchmarks/create-tv/data";

// Initialize global factories
const originalTVFactory = originalCreateTV(TV_MERGE_DISABLED);
const { tv: codefastTVFactory } = codefastCreateTV(TV_MERGE_DISABLED);

// Create variant functions using factories
const originalTVButton = originalTVFactory(buttonVariants);
const codefastTVButton = codefastTVFactory(buttonVariants);

/**
 * Create createTV benchmark without tailwind-merge
 */
export function createCreateTVWithoutMergeBenchmark(name = "CreateTV") {
  const bench = new Bench({
    name,
    ...BENCH_OPTIONS,
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
