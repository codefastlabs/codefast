import { compoundSlotsTestProps, compoundSlotsVariants } from "#/fixtures/compound-slots";
import { COMPOUND_SLOTS_WITH_MERGE, COMPOUND_SLOTS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import type { PaginationRenderer } from "#/fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { renderPaginationSlots } from "#/lib/render-slots";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const npmNoMerge = tailwindVariantsTv(compoundSlotsVariants, TV_MERGE_DISABLED) as PaginationRenderer;
const npmWithMerge = tailwindVariantsTv(compoundSlotsVariants, TV_MERGE_ENABLED) as PaginationRenderer;

function runCompoundSlotLoop(renderer: PaginationRenderer): void {
  for (const props of compoundSlotsTestProps) {
    renderPaginationSlots(renderer(props));
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function buildTailwindVariantsNpmCompoundSlotsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...COMPOUND_SLOTS_WITHOUT_MERGE,
      build: () => () => runCompoundSlotLoop(npmNoMerge),
    },
    {
      ...COMPOUND_SLOTS_WITH_MERGE,
      build: () => () => runCompoundSlotLoop(npmWithMerge),
    },
  ];
}
