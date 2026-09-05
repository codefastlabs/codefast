import { compoundSlotsTestProps, compoundSlotsVariants } from "#/fixtures/compound-slots";
import { COMPOUND_SLOTS_WITH_MERGE, COMPOUND_SLOTS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import type { PaginationRenderer } from "#/fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { renderPaginationSlots } from "#/lib/render-slots";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const codefastNoMerge = codefastTvFn(compoundSlotsVariants, TV_MERGE_DISABLED) as PaginationRenderer;
const codefastWithMerge = codefastTvFn(compoundSlotsVariants, TV_MERGE_ENABLED) as PaginationRenderer;

function runCompoundSlotLoop(renderer: PaginationRenderer): void {
  for (const props of compoundSlotsTestProps) {
    renderPaginationSlots(renderer(props));
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastCompoundSlotsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...COMPOUND_SLOTS_WITHOUT_MERGE,
      build: () => () => runCompoundSlotLoop(codefastNoMerge),
    },
    {
      ...COMPOUND_SLOTS_WITH_MERGE,
      build: () => () => runCompoundSlotLoop(codefastWithMerge),
    },
  ];
}
