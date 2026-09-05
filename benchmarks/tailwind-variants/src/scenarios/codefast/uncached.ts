import {
  UNCACHED_SIMPLE_WITH_MERGE,
  UNCACHED_SIMPLE_WITHOUT_MERGE,
  UNCACHED_SLOTS_WITH_MERGE,
  UNCACHED_SLOTS_WITHOUT_MERGE,
} from "#/fixtures/scenario-parity";
import { buttonVariants, simpleTestProps } from "#/fixtures/simple";
import type { ServicePreviewSlots } from "#/fixtures/slot-types";
import { slotsTestProps, slotsVariants } from "#/fixtures/slots";
import { TV_CACHE_AND_MERGE_DISABLED, TV_CACHE_DISABLED } from "#/harness/bench-options";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const flat = codefastTvFn(buttonVariants, TV_CACHE_DISABLED) as (props: unknown) => string;
const slots = codefastTvFn(slotsVariants, TV_CACHE_DISABLED) as (props: unknown) => ServicePreviewSlots;
const flatNoMerge = codefastTvFn(buttonVariants, TV_CACHE_AND_MERGE_DISABLED) as (props: unknown) => string;
const slotsNoMerge = codefastTvFn(slotsVariants, TV_CACHE_AND_MERGE_DISABLED) as (
  props: unknown,
) => ServicePreviewSlots;

/**
 * Every other scenario's props repeat, so with the cache on they measure a lookup. These keep the
 * resolver itself under measurement, and have no counterpart in a library without the same switch.
 * The without-merge rows pair with the with-merge ones so their delta isolates the merge step.
 *
 * @since 0.6.0
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
      ...UNCACHED_SIMPLE_WITHOUT_MERGE,
      excludeFromAggregates: true,
      build: () => () => {
        for (const props of simpleTestProps) {
          flatNoMerge(props);
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
    {
      ...UNCACHED_SLOTS_WITHOUT_MERGE,
      excludeFromAggregates: true,
      build: () => () => {
        for (const props of slotsTestProps) {
          const { base, content, description, footer, header, title } = slotsNoMerge(props);

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
