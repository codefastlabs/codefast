import { UNCACHED_SIMPLE_WITH_MERGE, UNCACHED_SLOTS_WITH_MERGE } from "#/fixtures/scenario-parity";
import { buttonVariants, simpleTestProps } from "#/fixtures/simple";
import type { ServicePreviewSlots } from "#/fixtures/slot-types";
import { slotsTestProps, slotsVariants } from "#/fixtures/slots";
import { TV_CACHE_DISABLED } from "#/harness/bench-options";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const flat = codefastTvFn(buttonVariants, TV_CACHE_DISABLED) as (props: unknown) => string;
const slots = codefastTvFn(slotsVariants, TV_CACHE_DISABLED) as (props: unknown) => ServicePreviewSlots;

/**
 * Every other scenario's props repeat, so with the cache on they measure a lookup. These keep the
 * resolver itself under measurement, and have no counterpart in a library without the same switch.
 */
export function buildCodefastUncachedScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...UNCACHED_SIMPLE_WITH_MERGE,
      excludeFromAggregates: true,
      build: () => () => {
        for (const props of simpleTestProps) {
          flat(props);
        }
      },
    },
    {
      ...UNCACHED_SLOTS_WITH_MERGE,
      excludeFromAggregates: true,
      build: () => () => {
        for (const props of slotsTestProps) {
          const { base, content, description, footer, header, title } = slots(props);

          base();
          header();
          content();
          footer();
          title();
          description();
        }
      },
    },
  ];
}
