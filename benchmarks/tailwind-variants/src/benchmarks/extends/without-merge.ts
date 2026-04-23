/**
 * Extends Without Tailwind Merge Benchmark
 *
 * Benchmarks configuration extension functionality without tailwind-merge
 */

import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_DISABLED } from "#/bench-options";
import { codefastTV, originalTV } from "#/benchmark-tv";
import {
  extendsBaseVariants,
  extendsExtensionVariants,
  extendsTestProps,
} from "#/benchmarks/extends/data";

const originalTVBase = originalTV(extendsBaseVariants, TV_MERGE_DISABLED);
const codefastTVBase = codefastTV(extendsBaseVariants, TV_MERGE_DISABLED);

// Initialize benchmark functions
const originalTVExtends = originalTV(
  { ...extendsExtensionVariants, extend: originalTVBase },
  TV_MERGE_DISABLED,
);
const codefastTVExtends = codefastTV(
  { ...extendsExtensionVariants, extend: codefastTVBase },
  TV_MERGE_DISABLED,
);

/**
 * Create extends benchmark without tailwind-merge
 */
export function createExtendsWithoutMergeBenchmark(name = "Extends") {
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
