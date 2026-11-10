/** The `repeat-*` rows: three selections rendered over and over with fresh props objects, the shape a UI has. */
import { repeatSimpleTestProps, repeatSlotsTestProps } from "#fixtures/repeat";
import {
  REPEAT_SIMPLE_WITH_MERGE,
  REPEAT_SIMPLE_WITHOUT_MERGE,
  REPEAT_SLOTS_WITH_MERGE,
  REPEAT_SLOTS_WITHOUT_MERGE,
} from "#fixtures/scenario-parity";
import { buttonVariants } from "#fixtures/simple";
import type { CardRenderer, FlatRenderer } from "#fixtures/slot-types";
import { slotsVariants } from "#fixtures/slots";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinFlatRenders, joinSlotRenders, renderCardSlots } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

function runFlatLoop(renderer: FlatRenderer): void {
  for (const props of repeatSimpleTestProps) {
    renderer({ ...props });
  }
}

function runSlotLoop(renderer: CardRenderer): void {
  for (const props of repeatSlotsTestProps) {
    renderCardSlots(renderer({ ...props }));
  }
}

/**
 * Builds the `repeat-*` rows for one library.
 *
 * @since 0.11.1
 */
export function buildRepeatScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const flatNoMerge = library.tv(buttonVariants, TV_MERGE_DISABLED) as FlatRenderer;
  const flatWithMerge = library.tv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer;
  const slotsNoMerge = library.tv(slotsVariants, TV_MERGE_DISABLED) as CardRenderer;
  const slotsWithMerge = library.tv(slotsVariants, TV_MERGE_ENABLED) as CardRenderer;

  return [
    {
      ...REPEAT_SIMPLE_WITHOUT_MERGE,
      build: () => () => runFlatLoop(flatNoMerge),
      output: () => joinFlatRenders(flatNoMerge, repeatSimpleTestProps),
    },
    {
      ...REPEAT_SIMPLE_WITH_MERGE,
      build: () => () => runFlatLoop(flatWithMerge),
      output: () => joinFlatRenders(flatWithMerge, repeatSimpleTestProps),
    },
    {
      ...REPEAT_SLOTS_WITHOUT_MERGE,
      build: () => () => runSlotLoop(slotsNoMerge),
      output: () => joinSlotRenders(slotsNoMerge, repeatSlotsTestProps),
    },
    {
      ...REPEAT_SLOTS_WITH_MERGE,
      build: () => () => runSlotLoop(slotsWithMerge),
      output: () => joinSlotRenders(slotsWithMerge, repeatSlotsTestProps),
    },
  ];
}
