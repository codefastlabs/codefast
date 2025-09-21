/**
 * Compound Slots Without Tailwind Merge Benchmark
 *
 * Benchmarks compound slots functionality without tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { compoundSlotsTestProps, mutableCompoundSlotsVariants } from "./data";

// Initialize benchmark functions
const originalTVCompoundSlots = originalTV(mutableCompoundSlotsVariants, { twMerge: false });
const codefastTVCompoundSlots = codefastTV(mutableCompoundSlotsVariants, { twMerge: false });

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
        const slots = originalTVCompoundSlots(props);

        // Access all slot functions to trigger full resolution

        slots.base();

        slots.item();

        slots.prev();

        slots.next();

        slots.cursor();
      }
    })
    .add("[compound-slots] @codefast/tailwind-variants", () => {
      for (const props of compoundSlotsTestProps) {
        const slots = codefastTVCompoundSlots(props);

        // Access all slot functions to trigger full resolution
        if (slots && typeof slots === "object") {
          const slotsObject = slots as Record<string, () => string>;

          slotsObject.base();
          slotsObject.item();
          slotsObject.prev();
          slotsObject.next();
          slotsObject.cursor();
        }
      }
    });

  return bench;
}
