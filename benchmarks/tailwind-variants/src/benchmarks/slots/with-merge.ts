/**
 * Slots With Tailwind Merge Benchmark
 *
 * Benchmarks slots functionality with tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { mutableSlotsVariants, slotsTestProps } from "@/data";
import { tv as codefastTV } from "@codefast/tailwind-variants";

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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        slots.base();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        slots.header();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        slots.content();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        slots.footer();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        slots.title();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        slots.description();
      }
    });

  return bench;
}
