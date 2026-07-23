import { compoundSlotsTestProps, compoundSlotsVariants } from "#/fixtures/compound-slots";
import { COMPOUND_SLOTS_WITH_MERGE, COMPOUND_SLOTS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import type { CompoundPaginationSlots } from "#/fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

type CompoundProps = (typeof compoundSlotsTestProps)[number];
type CompoundSlotsRenderer = (props: CompoundProps) => CompoundPaginationSlots;

const npmNoMerge = tailwindVariantsTv(compoundSlotsVariants, TV_MERGE_DISABLED) as CompoundSlotsRenderer;
const npmWithMerge = tailwindVariantsTv(compoundSlotsVariants, TV_MERGE_ENABLED) as CompoundSlotsRenderer;

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
