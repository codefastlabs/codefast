/** The `compound-slots-*` rows: a pagination-style component with compound slots. */
import { compoundSlotsTestProps, compoundSlotsVariants } from "#fixtures/compound-slots";
import { COMPOUND_SLOTS_WITH_MERGE, COMPOUND_SLOTS_WITHOUT_MERGE } from "#fixtures/scenario-parity";
import type { PaginationRenderer } from "#fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinSlotRenders, renderPaginationSlots } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

function runLoop(renderer: PaginationRenderer): void {
  for (const props of compoundSlotsTestProps) {
    renderPaginationSlots(renderer({ ...props }));
  }
}

/**
 * Builds the `compound-slots-*` rows for one library.
 *
 * @since 0.11.1
 */
export function buildCompoundSlotsScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const noMerge = library.tv(compoundSlotsVariants, TV_MERGE_DISABLED) as PaginationRenderer;
  const withMerge = library.tv(compoundSlotsVariants, TV_MERGE_ENABLED) as PaginationRenderer;

  return [
    {
      ...COMPOUND_SLOTS_WITHOUT_MERGE,
      build: () => () => runLoop(noMerge),
      output: () => joinSlotRenders(noMerge, compoundSlotsTestProps),
    },
    {
      ...COMPOUND_SLOTS_WITH_MERGE,
      build: () => () => runLoop(withMerge),
      output: () => joinSlotRenders(withMerge, compoundSlotsTestProps),
    },
  ];
}
