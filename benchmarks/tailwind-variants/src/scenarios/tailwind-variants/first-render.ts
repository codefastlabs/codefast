import { COLD_DEFINITIONS_PER_LOOP, FIRST_RENDER_SIMPLE, FIRST_RENDER_SLOTS } from "#/fixtures/scenario-parity";
import { buttonVariants } from "#/fixtures/simple";
import type { CardRenderer, FlatRenderer } from "#/fixtures/slot-types";
import { slotsVariants } from "#/fixtures/slots";
import { TV_MERGE_ENABLED } from "#/harness/bench-options";
import { renderEverySlot } from "#/lib/render-slots";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const defineAndRenderButton = (): number =>
  (tailwindVariantsTv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer)({ size: "sm", variant: "outline" }).length;

// Every slot renders: one library merges all slots on the first render, the other merges each slot on demand.
const defineAndRenderCard = (): number =>
  renderEverySlot(
    (tailwindVariantsTv(slotsVariants, TV_MERGE_ENABLED) as CardRenderer)({ size: "md", variant: "info" }),
  );

/**
 * Builds the first-render rows, which price a component definition plus its first render.
 *
 * @remarks Minus the define-only row this is the first render alone; the descriptors keep the ratio off
 * the aggregates because the work is per definition, not per render.
 */
export function buildTailwindVariantsNpmFirstRenderScenarios(): ReadonlyArray<BenchScenario> {
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
    },
  ];
}
