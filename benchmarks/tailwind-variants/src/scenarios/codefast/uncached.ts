import {
  UNCACHED_SIMPLE_WITH_MERGE,
  UNCACHED_SIMPLE_WITHOUT_MERGE,
  UNCACHED_SLOTS_WITH_MERGE,
  UNCACHED_SLOTS_WITHOUT_MERGE,
} from "#/fixtures/scenario-parity";
import { buttonVariants, simpleTestProps } from "#/fixtures/simple";
import type { CardRenderer, FlatRenderer } from "#/fixtures/slot-types";
import { slotsTestProps, slotsVariants } from "#/fixtures/slots";
import { TV_CACHE_AND_MERGE_DISABLED, TV_CACHE_DISABLED } from "#/harness/bench-options";
import { renderCardSlots } from "#/lib/render-slots";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const flat = codefastTvFn(buttonVariants, TV_CACHE_DISABLED) as FlatRenderer;
const flatNoMerge = codefastTvFn(buttonVariants, TV_CACHE_AND_MERGE_DISABLED) as FlatRenderer;
const slots = codefastTvFn(slotsVariants, TV_CACHE_DISABLED) as CardRenderer;
const slotsNoMerge = codefastTvFn(slotsVariants, TV_CACHE_AND_MERGE_DISABLED) as CardRenderer;

function runFlatLoop(renderer: FlatRenderer): void {
  for (const props of simpleTestProps) {
    renderer(props);
  }
}

function runSlotLoop(renderer: CardRenderer): void {
  for (const props of slotsTestProps) {
    renderCardSlots(renderer(props));
  }
}

/**
 * Builds the codefast-only control rows that keep the resolver itself under measurement.
 *
 * @remarks Every other row's props repeat and hit a cache; these turn the resolution memo and the merge
 * cache off, and pair each with-merge row with a without-merge one so their delta is the merge step.
 *
 * @since 0.6.0
 */
export function buildCodefastUncachedScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...UNCACHED_SIMPLE_WITH_MERGE,
      build: () => () => runFlatLoop(flat),
    },
    {
      ...UNCACHED_SIMPLE_WITHOUT_MERGE,
      build: () => () => runFlatLoop(flatNoMerge),
    },
    {
      ...UNCACHED_SLOTS_WITH_MERGE,
      build: () => () => runSlotLoop(slots),
    },
    {
      ...UNCACHED_SLOTS_WITHOUT_MERGE,
      build: () => () => runSlotLoop(slotsNoMerge),
    },
  ];
}
