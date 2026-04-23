/**
 * Extreme Slots With Tailwind Merge Benchmark
 *
 * Stress test slots with 12 slots and 15 compound slots - with tailwind-merge
 */

import type { ExtremeDialogSlots } from "#/benchmark-slot-types";
import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_ENABLED } from "#/bench-options";
import { codefastTV, originalTV } from "#/benchmark-tv";

import { extremeSlotsTestProps, extremeSlotsVariants } from "#/benchmarks/extreme/data";

type ExtremeSlotsProps = (typeof extremeSlotsTestProps)[number];
type ExtremeSlotsRenderer = (props: ExtremeSlotsProps) => ExtremeDialogSlots;

// Initialize benchmark functions
const originalTVExtremeSlots = originalTV(
  extremeSlotsVariants,
  TV_MERGE_ENABLED,
) as ExtremeSlotsRenderer;
const codefastTVExtremeSlots = codefastTV(
  extremeSlotsVariants,
  TV_MERGE_ENABLED,
) as ExtremeSlotsRenderer;

/**
 * Create extreme slots benchmark with tailwind-merge
 */
export function createExtremeSlotsWithMergeBenchmark(
  name = "Extreme Slots With Merge (12 slots, 15 compound slots)",
) {
  const bench = new Bench({
    name,
    ...BENCH_OPTIONS,
  });

  bench
    .add("tailwind-variants", () => {
      for (const props of extremeSlotsTestProps) {
        const slots = originalTVExtremeSlots(props);
        // Access all slots to ensure full computation
        slots.trigger();
        slots.content();
        slots.header();
        slots.footer();
        slots.title();
        slots.description();
        slots.action();
        slots.icon();
        slots.overlay();
        slots.close();
        slots.separator();
        slots.badge();
      }
    })
    .add("@codefast/tailwind-variants", () => {
      for (const props of extremeSlotsTestProps) {
        const slots = codefastTVExtremeSlots(props);
        // Access all slots to ensure full computation
        slots.trigger();
        slots.content();
        slots.header();
        slots.footer();
        slots.title();
        slots.description();
        slots.action();
        slots.icon();
        slots.overlay();
        slots.close();
        slots.separator();
        slots.badge();
      }
    });

  return bench;
}
