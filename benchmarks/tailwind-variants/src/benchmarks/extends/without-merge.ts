/**
 * Extends Without Tailwind Merge Benchmark
 *
 * Benchmarks configuration extension functionality without tailwind-merge
 */

import { Bench } from "tinybench";

import { codefastTV, originalTV } from "#/benchmark-tv";
import {
  extendsBaseVariants,
  extendsExtensionVariants,
  extendsTestProps,
} from "#/benchmarks/extends/data";

const originalTVBase = originalTV(extendsBaseVariants, { twMerge: false });
const codefastTVBase = codefastTV(extendsBaseVariants, { twMerge: false });

// Initialize benchmark functions
const originalTVExtends = originalTV(
  { ...extendsExtensionVariants, extend: originalTVBase },
  { twMerge: false },
);
const codefastTVExtends = codefastTV(
  { ...extendsExtensionVariants, extend: codefastTVBase },
  { twMerge: false },
);

/**
 * Create extends benchmark without tailwind-merge
 */
export function createExtendsWithoutMergeBenchmark(name = "Extends") {
  const bench = new Bench({
    name,
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
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
