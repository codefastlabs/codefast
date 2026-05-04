import type { CompoundPaginationSlots } from "#/fixtures/slot-types";
import { codefastTvFn } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import { compoundSlotsTestProps, compoundSlotsVariants } from "#/fixtures/compound-slots";

type CompoundProps = (typeof compoundSlotsTestProps)[number];
type CompoundSlotsRenderer = (props: CompoundProps) => CompoundPaginationSlots;

const codefastNoMerge = codefastTvFn(
  compoundSlotsVariants,
  TV_MERGE_DISABLED,
) as CompoundSlotsRenderer;
const codefastWithMerge = codefastTvFn(
  compoundSlotsVariants,
  TV_MERGE_ENABLED,
) as CompoundSlotsRenderer;

function runCompoundSlotLoop(renderer: CompoundSlotsRenderer): void {
  for (const props of compoundSlotsTestProps) {
    const { base, cursor, item, next, prev } = renderer(props);
    base();
    item();
    prev();
    next();
    cursor();
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastCompoundSlotsScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "compound-slots-without-merge",
      group: "compound-slots",
      what: "Compound slots (pagination-style) without tailwind-merge",
      build: () => () => runCompoundSlotLoop(codefastNoMerge),
    },
    {
      id: "compound-slots-with-merge",
      group: "compound-slots",
      what: "Compound slots with tailwind-merge on tv",
      build: () => () => runCompoundSlotLoop(codefastWithMerge),
    },
  ];
}
