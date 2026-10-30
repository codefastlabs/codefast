/** The `slot-class` row: card slots each called with the `className` its sub-component was given. */
import { SLOT_CLASS_WITH_MERGE } from "#fixtures/scenario-parity";
import { slotClassTestCalls } from "#fixtures/slot-class";
import type { ClassedCardRenderer } from "#fixtures/slot-types";
import { slotsVariants } from "#fixtures/slots";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { renderCardSlotsWithClasses } from "#lib/render-slots";
import { tailwindVariantsTv } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

const card = tailwindVariantsTv(slotsVariants, TV_MERGE_ENABLED) as ClassedCardRenderer;

/** Builds the `slot-class` row. */
export function buildTailwindVariantsNpmSlotClassScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...SLOT_CLASS_WITH_MERGE,
      build: () => () => {
        for (const call of slotClassTestCalls) {
          renderCardSlotsWithClasses(card({ ...call.props }), call.classes);
        }
      },
    },
  ];
}
