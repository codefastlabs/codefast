/**
 * Slots Without Tailwind Merge Benchmark
 *
 * Benchmarks slots functionality without tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { slotsTestProps, slotsVariants } from "@/benchmarks/slots/data";
import { tv as codefastTV } from "@codefast/tailwind-variants";

// Initialize benchmark functions
const originalTVSlots = originalTV(slotsVariants, { twMerge: false });
const codefastTVSlots = codefastTV(slotsVariants, { twMerge: false });

/**
 * Create slots benchmark without tailwind-merge
 */
export function createSlotsWithoutMergeBenchmark(): Bench {
  const bench = new Bench({
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("[slots] tailwind-variants", () => {
      for (const props of slotsTestProps) {
        const { base, content, description, footer, header, title } = originalTVSlots(props);

        base();
        header();
        content();
        footer();
        title();
        description();
      }
    })
    .add("[slots] @codefast/tailwind-variants", () => {
      for (const props of slotsTestProps) {
        const { base, content, description, footer, header, title } = codefastTVSlots(props);

        base();
        header();
        content();
        footer();
        title();
        description();
      }
    });

  return bench;
}
