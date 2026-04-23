/**
 * CreateTV With Tailwind Merge Benchmark
 *
 * Benchmarks global factory configuration functionality with tailwind-merge
 */

import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_ENABLED } from "#/bench-options";
import { codefastCreateTV, originalCreateTV } from "#/benchmark-tv";
import { buttonVariants, simpleTestProps } from "#/benchmarks/create-tv/data";

// Initialize global factories
const originalTVFactory = originalCreateTV(TV_MERGE_ENABLED);
const { tv: codefastTVFactory } = codefastCreateTV(TV_MERGE_ENABLED);

// Create variant functions using factories
const originalTVButton = originalTVFactory(buttonVariants);
const codefastTVButton = codefastTVFactory(buttonVariants);

/**
 * Create createTV benchmark with tailwind-merge
 */
export function createCreateTVWithMergeBenchmark(name = "CreateTV (With Tailwind Merge)") {
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
