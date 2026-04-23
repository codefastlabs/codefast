/**
 * Slots Without Tailwind Merge Benchmark
 *
 * Benchmarks slots functionality without tailwind-merge
 */

import type { ServicePreviewSlots } from "#/benchmark-slot-types";
import { Bench } from "tinybench";

import { codefastTV, originalTV } from "#/benchmark-tv";

import { slotsTestProps, slotsVariants } from "#/benchmarks/slots/data";

type SlotsProps = (typeof slotsTestProps)[number];
type SlotsRenderer = (props: SlotsProps) => ServicePreviewSlots;

// Initialize benchmark functions
const originalTVSlots = originalTV(slotsVariants, { twMerge: false }) as SlotsRenderer;
const codefastTVSlots = codefastTV(slotsVariants, { twMerge: false }) as SlotsRenderer;

/**
 * Create slots benchmark without tailwind-merge
 */
export function createSlotsWithoutMergeBenchmark(name = "Slots") {
  const bench = new Bench({
    name,
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
