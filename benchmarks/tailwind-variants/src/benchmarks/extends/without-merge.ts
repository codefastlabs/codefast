/**
 * Extends Without Tailwind Merge Benchmark
 *
 * Benchmarks configuration extension functionality without tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { extendsTestProps, mutableExtendsExtensionVariants } from "./data";

// Initialize benchmark functions
const originalTVExtends = originalTV(mutableExtendsExtensionVariants, { twMerge: false });
const codefastTVExtends = codefastTV(mutableExtendsExtensionVariants, { twMerge: false });

/**
 * Create extends benchmark without tailwind-merge
 */
export function createExtendsWithoutMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("[extends] tailwind-variants", () => {
      for (const props of extendsTestProps) {
        originalTVExtends(props);
      }
    })
    .add("[extends] @codefast/tailwind-variants", () => {
      for (const props of extendsTestProps) {
        codefastTVExtends(props);
      }
    });

  return bench;
}
