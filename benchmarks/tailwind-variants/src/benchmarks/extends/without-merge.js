/**
 * Extends Without Tailwind Merge Benchmark
 *
 * Benchmarks configuration extension functionality without tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { extendsExtensionVariants, extendsTestProps } from "./data.js";
import { tv as codefastTV } from "@codefast/tailwind-variants";

// Initialize benchmark functions
const originalTVExtends = originalTV(extendsExtensionVariants, { twMerge: false });
const codefastTVExtends = codefastTV(extendsExtensionVariants, { twMerge: false });

/**
 * Create extends benchmark without tailwind-merge
 */
export function createExtendsWithoutMergeBenchmark() {
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
