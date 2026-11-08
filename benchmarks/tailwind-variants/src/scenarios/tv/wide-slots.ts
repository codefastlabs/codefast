/** The `wide-slots` row: a sixteen-slot component with twenty compound-tested variants. */
import { WIDE_SLOTS_WITH_MERGE } from "#fixtures/scenario-parity";
import { wideSlotsTestProps, wideSlotsVariants } from "#fixtures/wide-slots";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinSlotRenders, renderEverySlot } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

type WideRenderer = (props: Readonly<Record<string, unknown>>) => Readonly<Record<string, () => string>>;

/**
 * Builds the `wide-slots` row for one library.
 *
 * @since 0.11.1
 */
export function buildWideSlotsScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  return [
    {
      ...WIDE_SLOTS_WITH_MERGE,
      build: () => {
        const component = library.tv(wideSlotsVariants, TV_MERGE_ENABLED) as WideRenderer;

        return () => {
          for (const props of wideSlotsTestProps) {
            renderEverySlot(component({ ...props }));
          }
        };
      },
      output: () =>
        joinSlotRenders(library.tv(wideSlotsVariants, TV_MERGE_ENABLED) as WideRenderer, wideSlotsTestProps),
    },
  ];
}
