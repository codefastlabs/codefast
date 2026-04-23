/**
 * Extreme Slots Without Tailwind Merge Benchmark
 *
 * Stress test slots with 12 slots and 15 compound slots
 */

import type { ExtremeDialogSlots } from "#/benchmark-slot-types";
import { Bench } from "tinybench";

import { codefastTV, originalTV } from "#/benchmark-tv";

import { extremeSlotsTestProps, extremeSlotsVariants } from "#/benchmarks/extreme/data";

type ExtremeSlotsProps = (typeof extremeSlotsTestProps)[number];
type ExtremeSlotsRenderer = (props: ExtremeSlotsProps) => ExtremeDialogSlots;

// Initialize benchmark functions
const originalTVExtremeSlots = originalTV(extremeSlotsVariants, {
  twMerge: false,
}) as ExtremeSlotsRenderer;
const codefastTVExtremeSlots = codefastTV(extremeSlotsVariants, {
  twMerge: false,
}) as ExtremeSlotsRenderer;

/**
 * Create extreme slots benchmark without tailwind-merge
 */
export function createExtremeSlotsWithoutMergeBenchmark(
  name = "Extreme Slots (12 slots, 15 compound slots)",
) {
  const bench = new Bench({
    name,
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
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
