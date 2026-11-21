/** The `slot-class` row: card slots each called with the `className` its sub-component was given. */
import { SLOT_CLASS_WITH_MERGE } from "#fixtures/scenario-parity";
import { slotClassTestCalls } from "#fixtures/slot-class";
import type { ClassedCardRenderer } from "#fixtures/slot-types";
import { slotsVariants } from "#fixtures/slots";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { renderCardSlotsWithClasses } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/** Every slot the card renders, each called with the `className` a call gives it, absent included. */
const CARD_SLOTS = ["base", "content", "description", "footer", "header", "title"] as const;

/**
 * Builds the `slot-class` row for one library.
 *
 * @since 0.11.1
 */
export function buildSlotClassScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const card = library.tv(slotsVariants, TV_MERGE_ENABLED) as ClassedCardRenderer;

  return [
    {
      ...SLOT_CLASS_WITH_MERGE,
      build: () => () => {
        for (const call of slotClassTestCalls) {
          renderCardSlotsWithClasses(card({ ...call.props }), call.classes);
        }
      },
      output: () =>
        slotClassTestCalls
          .map((call) => {
            const slots = card({ ...call.props });

            return CARD_SLOTS.map((slot) => `${slot}: ${slots[slot]({ className: call.classes[slot] })}`).join("\n");
          })
          .join("\n\n"),
    },
  ];
}
