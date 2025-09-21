/**
 * Compound Slots With Tailwind Merge Benchmark
 *
 * Benchmarks compound slots functionality with tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { compoundSlotsTestProps, compoundSlotsVariants } from "./data";

// Initialize benchmark functions
const originalTVCompoundSlots = originalTV(compoundSlotsVariants);
const codefastTVCompoundSlots = codefastTV(compoundSlotsVariants);

/**
 * Create compound slots benchmark with tailwind-merge
 */
export function createCompoundSlotsWithMergeBenchmark(): Bench {
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
