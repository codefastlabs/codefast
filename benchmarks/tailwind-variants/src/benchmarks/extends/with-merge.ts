/**
 * Extends With Tailwind Merge Benchmark
 *
 * Benchmarks configuration extension functionality with tailwind-merge
 */

import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_ENABLED } from "#/bench-options";
import { codefastTV, originalTV } from "#/benchmark-tv";
import {
  extendsBaseVariants,
  extendsExtensionVariants,
  extendsTestProps,
} from "#/benchmarks/extends/data";

const originalTVBase = originalTV(extendsBaseVariants, TV_MERGE_ENABLED);
const codefastTVBase = codefastTV(extendsBaseVariants, TV_MERGE_ENABLED);

// Initialize benchmark functions
const originalTVExtends = originalTV(
  { ...extendsExtensionVariants, extend: originalTVBase },
  TV_MERGE_ENABLED,
);
const codefastTVExtends = codefastTV(
  { ...extendsExtensionVariants, extend: codefastTVBase },
  TV_MERGE_ENABLED,
);

/**
 * Create extends benchmark with tailwind-merge
 */
export function createExtendsWithMergeBenchmark(name = "Extends (With Tailwind Merge)") {
  const bench = new Bench({
    name,
    ...BENCH_OPTIONS,
  });

  bench
    .add("tailwind-variants", () => {
      for (const props of extendsTestProps) {
        originalTVExtends(props);
      }
    })
    .add("@codefast/tailwind-variants", () => {
      for (const props of extendsTestProps) {
        codefastTVExtends(props);
      }
    });

  return bench;
}
