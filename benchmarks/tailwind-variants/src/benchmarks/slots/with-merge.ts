/**
 * Slots With Tailwind Merge Benchmark
 *
 * Benchmarks slots functionality with tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

import { mutableSlotsVariants, slotsTestProps } from "./data";

// Initialize benchmark functions
const originalTVSlots = originalTV(mutableSlotsVariants);
const codefastTVSlots = codefastTV(mutableSlotsVariants);

/**
 * Create slots benchmark with tailwind-merge
 */
export function createSlotsWithMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("[slots] tailwind-variants", () => {
      for (const props of slotsTestProps) {
        const slots = originalTVSlots(props);

        // Access all slot functions to trigger full resolution

        slots.base();

        slots.header();

        slots.content();

        slots.footer();

        slots.title();

        slots.description();
      }
    })
    .add("[slots] @codefast/tailwind-variants", () => {
      for (const props of slotsTestProps) {
        const slots = codefastTVSlots(props);

        // Access all slot functions to trigger full resolution
        if (slots && typeof slots === "object") {
          const slotsObject = slots as Record<string, () => string>;

          slotsObject.base();
          slotsObject.header();
          slotsObject.content();
          slotsObject.footer();
          slotsObject.title();
          slotsObject.description();
        }
      }
    });

  return bench;
}
