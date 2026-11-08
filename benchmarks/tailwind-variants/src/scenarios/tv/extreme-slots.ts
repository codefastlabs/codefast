/** The `extreme-slots-*` rows: a twelve-slot dialog with many variants. */
import { extremeSlotsTestProps, extremeSlotsVariants } from "#fixtures/extreme";
import { EXTREME_SLOTS_WITH_MERGE, EXTREME_SLOTS_WITHOUT_MERGE } from "#fixtures/scenario-parity";
import type { DialogRenderer } from "#fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinSlotRenders, renderDialogSlots } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

function runLoop(renderer: DialogRenderer): void {
  for (const props of extremeSlotsTestProps) {
    renderDialogSlots(renderer({ ...props }));
  }
}

/** Builds the `extreme-slots-*` rows for one library. */
export function buildExtremeSlotsScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const noMerge = library.tv(extremeSlotsVariants, TV_MERGE_DISABLED) as DialogRenderer;
  const withMerge = library.tv(extremeSlotsVariants, TV_MERGE_ENABLED) as DialogRenderer;

  return [
    {
      ...EXTREME_SLOTS_WITHOUT_MERGE,
      build: () => () => runLoop(noMerge),
      output: () => joinSlotRenders(noMerge, extremeSlotsTestProps),
    },
    {
      ...EXTREME_SLOTS_WITH_MERGE,
      build: () => () => runLoop(withMerge),
      output: () => joinSlotRenders(withMerge, extremeSlotsTestProps),
    },
  ];
}
