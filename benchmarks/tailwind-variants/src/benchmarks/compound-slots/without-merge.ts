/**
 * Compound Slots Without Tailwind Merge Benchmark
 *
 * Benchmarks compound slots functionality without tailwind-merge
 */

import type { CompoundPaginationSlots } from "#/benchmark-slot-types";
import { Bench } from "tinybench";

import { codefastTV, originalTV } from "#/benchmark-tv";

import { compoundSlotsTestProps, compoundSlotsVariants } from "#/benchmarks/compound-slots/data";

type CompoundProps = (typeof compoundSlotsTestProps)[number];
type CompoundSlotsRenderer = (props: CompoundProps) => CompoundPaginationSlots;

// Initialize benchmark functions
const originalTVCompoundSlots = originalTV(compoundSlotsVariants, {
  twMerge: false,
}) as CompoundSlotsRenderer;
const codefastTVCompoundSlots = codefastTV(compoundSlotsVariants, {
  twMerge: false,
}) as CompoundSlotsRenderer;

/**
 * Create compound slots benchmark without tailwind-merge
 */
export function createCompoundSlotsWithoutMergeBenchmark(name = "Compound Slots") {
  const bench = new Bench({
    name,
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add("tailwind-variants", () => {
      for (const props of compoundSlotsTestProps) {
        const { base, cursor, item, next, prev } = originalTVCompoundSlots(props);

        base();
        item();
        prev();
        next();
        cursor();
      }
    })
    .add("@codefast/tailwind-variants", () => {
      for (const props of compoundSlotsTestProps) {
        const { base, cursor, item, next, prev } = codefastTVCompoundSlots(props);

        base();
        item();
        prev();
        next();
        cursor();
      }
    });

  return bench;
}
