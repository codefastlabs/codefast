/**
 * Extends Without Tailwind Merge Benchmark
 *
 * Benchmarks configuration extension functionality without tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { extendsBaseVariants, extendsExtensionVariants, extendsTestProps } from "./data.js";
import { tv as codefastTV } from "@codefast/tailwind-variants";

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
export function createExtendsWithoutMergeBenchmark() {
  const bench = new Bench({
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
