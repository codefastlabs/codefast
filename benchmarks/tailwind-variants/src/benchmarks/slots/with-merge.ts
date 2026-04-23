/**
 * Slots With Tailwind Merge Benchmark
 *
 * Benchmarks slots functionality with tailwind-merge
 */

import type { ServicePreviewSlots } from "#/benchmark-slot-types";
import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_ENABLED } from "#/bench-options";
import { codefastTV, originalTV } from "#/benchmark-tv";

import { slotsTestProps, slotsVariants } from "#/benchmarks/slots/data";

type SlotsProps = (typeof slotsTestProps)[number];
type SlotsRenderer = (props: SlotsProps) => ServicePreviewSlots;

// Initialize benchmark functions
const originalTVSlots = originalTV(slotsVariants, TV_MERGE_ENABLED) as SlotsRenderer;
const codefastTVSlots = codefastTV(slotsVariants, TV_MERGE_ENABLED) as SlotsRenderer;

/**
 * Create slots benchmark with tailwind-merge
 */
export function createSlotsWithMergeBenchmark(name = "Slots (With Tailwind Merge)") {
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
