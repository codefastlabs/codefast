/**
 * Slots Without Tailwind Merge Benchmark
 *
 * Benchmarks slots functionality without tailwind-merge
 */

import type { ServicePreviewSlots } from "#/benchmark-slot-types";
import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_DISABLED } from "#/bench-options";
import { codefastTV, originalTV } from "#/benchmark-tv";

import { slotsTestProps, slotsVariants } from "#/benchmarks/slots/data";

type SlotsProps = (typeof slotsTestProps)[number];
type SlotsRenderer = (props: SlotsProps) => ServicePreviewSlots;

// Initialize benchmark functions
const originalTVSlots = originalTV(slotsVariants, TV_MERGE_DISABLED) as SlotsRenderer;
const codefastTVSlots = codefastTV(slotsVariants, TV_MERGE_DISABLED) as SlotsRenderer;

/**
 * Create slots benchmark without tailwind-merge
 */
export function createSlotsWithoutMergeBenchmark(name = "Slots") {
  const bench = new Bench({
    name,
    ...BENCH_OPTIONS,
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
