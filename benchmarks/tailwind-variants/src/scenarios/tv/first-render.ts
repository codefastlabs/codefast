/** The `first-render-*` rows: a component definition plus its first render. */
import { COLD_DEFINITIONS_PER_LOOP, FIRST_RENDER_SIMPLE, FIRST_RENDER_SLOTS } from "#fixtures/scenario-parity";
import { buttonVariants } from "#fixtures/simple";
import type { CardRenderer, FlatRenderer } from "#fixtures/slot-types";
import { slotsVariants } from "#fixtures/slots";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinEverySlot, renderEverySlot } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the first-render rows, which price a component definition plus its first render.
 *
 * @remarks Minus the define-only row this is the first render alone; the descriptors keep the ratio off
 * the aggregates because the work is per definition, not per render.
 */
export function buildFirstRenderScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const defineAndRenderButton = (): number =>
    (library.tv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer)({ size: "sm", variant: "outline" }).length;

  // Every slot renders: one library merges all slots on the first render, the other merges each slot on demand.
  const defineAndRenderCard = (): number =>
    renderEverySlot((library.tv(slotsVariants, TV_MERGE_ENABLED) as CardRenderer)({ size: "md", variant: "info" }));

  return [
    {
      ...FIRST_RENDER_SIMPLE,
      // Consuming the render keeps the definition alive: a `tv` call nothing reads can be elided.
      build: () => {
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            renderedLength += defineAndRenderButton();
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
      sanity: () => defineAndRenderButton() > 0,
      output: () => (library.tv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer)({ size: "sm", variant: "outline" }),
    },
    {
      ...FIRST_RENDER_SLOTS,
      build: () => {
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            renderedLength += defineAndRenderCard();
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
      sanity: () => defineAndRenderCard() > 0,
      output: () =>
        joinEverySlot((library.tv(slotsVariants, TV_MERGE_ENABLED) as CardRenderer)({ size: "md", variant: "info" })),
    },
  ];
}
