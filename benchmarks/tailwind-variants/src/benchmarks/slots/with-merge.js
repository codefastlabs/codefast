/**
 * Slots With Tailwind Merge Benchmark
 *
 * Benchmarks slots functionality with tailwind-merge
 */

import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { slotsTestProps, slotsVariants } from "./data.js";
import { tv as codefastTV } from "@codefast/tailwind-variants";

// Initialize benchmark functions
const originalTVSlots = originalTV(slotsVariants);
const codefastTVSlots = codefastTV(slotsVariants);

/**
 * Create slots benchmark with tailwind-merge
 */
export function createSlotsWithMergeBenchmark() {
  const bench = new Bench({
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("tailwind-variants", () => {
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
    .add("@codefast/tailwind-variants", () => {
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
