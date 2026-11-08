import { SLOTS_WITH_MERGE, SLOTS_WITHOUT_MERGE } from "#fixtures/scenario-parity";
import type { CardRenderer } from "#fixtures/slot-types";
/** The `slots-*` rows: a card-style slot component. */
import { slotsTestProps, slotsVariants } from "#fixtures/slots";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinSlotRenders, renderCardSlots } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

function runLoop(renderer: CardRenderer): void {
  for (const props of slotsTestProps) {
    renderCardSlots(renderer({ ...props }));
  }
}

/** Builds the `slots-*` rows for one library. */
export function buildSlotsScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const noMerge = library.tv(slotsVariants, TV_MERGE_DISABLED) as CardRenderer;
  const withMerge = library.tv(slotsVariants, TV_MERGE_ENABLED) as CardRenderer;

  return [
    {
      ...SLOTS_WITHOUT_MERGE,
      build: () => () => runLoop(noMerge),
      output: () => joinSlotRenders(noMerge, slotsTestProps),
    },
    {
      ...SLOTS_WITH_MERGE,
      build: () => () => runLoop(withMerge),
      output: () => joinSlotRenders(withMerge, slotsTestProps),
    },
  ];
}
