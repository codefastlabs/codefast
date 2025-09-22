/**
 * Extends With Tailwind Merge Benchmark
 *
 * Benchmarks configuration extension functionality with tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { extendsBaseVariants, extendsExtensionVariants, extendsTestProps } from "./data.js";
import { tv as codefastTV } from "@codefast/tailwind-variants";

const originalTVBase = originalTV(extendsBaseVariants);
const codefastTVBase = codefastTV(extendsBaseVariants);

// Initialize benchmark functions
const originalTVExtends = originalTV({ ...extendsExtensionVariants, extend: originalTVBase });
const codefastTVExtends = codefastTV({ ...extendsExtensionVariants, extend: codefastTVBase });

/**
 * Create extends benchmark with tailwind-merge
 */
export function createExtendsWithMergeBenchmark() {
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
