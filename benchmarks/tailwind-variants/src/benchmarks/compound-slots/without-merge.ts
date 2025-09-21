/**
 * Compound Slots Without Tailwind Merge Benchmark
 *
 * Benchmarks compound slots functionality without tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { compoundSlotsTestProps, compoundSlotsVariants } from "./data";

// Initialize benchmark functions
const originalTVCompoundSlots = originalTV(compoundSlotsVariants, { twMerge: false });
const codefastTVCompoundSlots = codefastTV(compoundSlotsVariants, { twMerge: false });

/**
 * Create compound slots benchmark without tailwind-merge
 */
export function createCompoundSlotsWithoutMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("[compound-slots] tailwind-variants", () => {
      for (const props of compoundSlotsTestProps) {
        const { base, cursor, item, next, prev } = originalTVCompoundSlots(props);

        base();
        item();
        prev();
        next();
        cursor();
      }
    })
    .add("[compound-slots] @codefast/tailwind-variants", () => {
      for (const props of compoundSlotsTestProps) {
        const { base, cursor, item, next, prev } = codefastTVCompoundSlots(props);

        base();
        item();
        prev();
        next();
        cursor();
      }
    });

  return bench;
}
